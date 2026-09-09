import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { NotificationService } from '../notification/notification.service';
import { buildKafkaConfig, kafkaConsumerRetry } from './kafka-client.config';
import {
  KAFKA_TOPIC_TRIP_EVENTS,
  TripAcceptedPayload,
  TripCreatedPayload,
  TripEventEnvelope,
  TripStatusChangedPayload,
} from './trip-events.types';

const TRIP_EVENTS_DLQ_TOPIC = 'trip.events.dlq.v1';
const TRIP_EVENTS_GROUP_ID = 'admin-service-trip-events-v1';

@Injectable()
export class TripEventsConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TripEventsConsumerService.name);
  private readonly topic: string;
  private readonly dlqTopic: string;
  private readonly kafka: Kafka;
  private consumer: Consumer | null = null;
  private producer: Producer | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {
    this.topic = KAFKA_TOPIC_TRIP_EVENTS;
    this.dlqTopic = TRIP_EVENTS_DLQ_TOPIC;
    this.kafka = new Kafka(buildKafkaConfig(this.configService, 'admin-service'));
  }

  async onModuleInit(): Promise<void> {
    if (!this.configService.get<string>('KAFKA_BROKERS')) {
      this.logger.warn('Trip events consumer disabled (KAFKA_BROKERS not set)');
      return;
    }

    try {
      const groupId = TRIP_EVENTS_GROUP_ID;
      this.consumer = this.kafka.consumer({
        groupId,
        sessionTimeout: 60000,
        heartbeatInterval: 5000,
        retry: kafkaConsumerRetry(),
      });
      this.producer = this.kafka.producer();
      await this.producer.connect();
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async (message) => this.handleMessage(message),
      });
      this.logger.log(`Trip events consumer connected (topic=${this.topic}, group=${groupId})`);
    } catch (error) {
      this.logger.error(`Trip events consumer init failed: ${this.errorMessage(error)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer?.disconnect().catch(() => undefined);
    await this.producer?.disconnect().catch(() => undefined);
  }

  private async handleMessage({ message, partition, topic }: EachMessagePayload): Promise<void> {
    const value = message.value?.toString();
    if (!value) return;

    try {
      const event = JSON.parse(value) as TripEventEnvelope<unknown>;
      if (!this.isBaseEnvelope(event)) {
        await this.publishDlq('INVALID_EVENT_SHAPE', value, partition, topic);
        return;
      }

      if (event.eventType === 'TRIP_CREATED') {
        if (!this.isTripCreatedPayload(event.payload)) {
          await this.publishDlq('INVALID_TRIP_CREATED_PAYLOAD', value, partition, topic);
          return;
        }
        await this.onTripCreated(event as TripEventEnvelope<TripCreatedPayload>);
        return;
      }
      if (event.eventType === 'TRIP_ACCEPTED') {
        if (!this.isTripAcceptedPayload(event.payload)) {
          await this.publishDlq('INVALID_TRIP_ACCEPTED_PAYLOAD', value, partition, topic);
          return;
        }
        await this.onTripAccepted(event as TripEventEnvelope<TripAcceptedPayload>);
        return;
      }
      if (event.eventType === 'TRIP_STATUS_CHANGED') {
        if (!this.isTripStatusChangedPayload(event.payload)) {
          await this.publishDlq(
            'INVALID_TRIP_STATUS_CHANGED_PAYLOAD',
            value,
            partition,
            topic,
          );
          return;
        }
        return;
      }

      this.logger.warn(`Ignoring unsupported eventType=${event.eventType}`);
    } catch (error) {
      this.logger.error(`Trip event handle failed: ${this.errorMessage(error)}`);
      await this.publishDlq('EVENT_HANDLER_EXCEPTION', value, partition, topic);
    }
  }

  private formatPersonName(
    firstName?: string,
    lastName?: string,
    fallback?: string,
  ): string {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    return name || fallback || 'N/A';
  }

  /** Prefer business trip_id (e.g. TRP-001) over internal UUID in user-facing text. */
  private tripRef(tripId: string, tripDisplayId?: string): string {
    return tripDisplayId?.trim() || tripId;
  }

  private async onTripCreated(event: TripEventEnvelope<TripCreatedPayload>): Promise<void> {
    const payload = event.payload;
    const vendorName = this.formatPersonName(
      payload.vendorFirstName,
      payload.vendorLastName,
      payload.vendorId,
    );
    const tripRef = this.tripRef(payload.tripId, payload.tripDisplayId);
    await this.notificationService.create(
      {
        notificationType: 'TRIP_CREATED',
        title: 'New Trip Created',
        message: `Trip ${tripRef} was created for vendor ${vendorName}.`,
        creatorType: 'SYSTEM',
        tripId: payload.tripId,
        userId: payload.riderId,
      },
      { pushLive: false },
    );
  }

  private async onTripAccepted(event: TripEventEnvelope<TripAcceptedPayload>): Promise<void> {
    const payload = event.payload;
    const driverName = payload.driverName?.trim() || payload.driverId;
    const tripRef = this.tripRef(payload.tripId, payload.tripDisplayId);
    await this.notificationService.create(
      {
        notificationType: 'TRIP_ACCEPTED',
        title: 'Trip Accepted',
        message: `Trip ${tripRef} accepted by driver ${driverName}.`,
        creatorType: 'SYSTEM',
        tripId: payload.tripId,
        userId: payload.driverId,
      },
      { pushLive: false },
    );
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isBaseEnvelope(value: unknown): value is TripEventEnvelope<unknown> {
    if (!this.isObject(value)) return false;
    return (
      typeof value.eventId === 'string' &&
      typeof value.eventType === 'string' &&
      typeof value.occurredAt === 'string' &&
      value.version === 'v1' &&
      'payload' in value
    );
  }

  private isTripCreatedPayload(value: unknown): value is TripCreatedPayload {
    if (!this.isObject(value)) return false;
    const pickup = value.pickup;
    const dropoff = value.dropoff;
    return (
      typeof value.tripId === 'string' &&
      typeof value.riderId === 'string' &&
      typeof value.status === 'string' &&
      this.isObject(pickup) &&
      typeof pickup.lat === 'number' &&
      typeof pickup.lng === 'number' &&
      this.isObject(dropoff) &&
      typeof dropoff.lat === 'number' &&
      typeof dropoff.lng === 'number'
    );
  }

  private isTripAcceptedPayload(value: unknown): value is TripAcceptedPayload {
    if (!this.isObject(value)) return false;
    return (
      typeof value.tripId === 'string' &&
      typeof value.driverId === 'string' &&
      typeof value.acceptedAt === 'string'
    );
  }

  private isTripStatusChangedPayload(
    value: unknown,
  ): value is TripStatusChangedPayload {
    if (!this.isObject(value)) return false;
    return (
      typeof value.tripId === 'string' &&
      typeof value.previousStatus === 'string' &&
      typeof value.status === 'string' &&
      typeof value.changedAt === 'string'
    );
  }

  private async publishDlq(
    reason: string,
    rawEvent: string,
    partition: number,
    sourceTopic: string,
  ): Promise<void> {
    if (!this.producer) return;
    try {
      await this.producer.send({
        topic: this.dlqTopic,
        messages: [
          {
            value: JSON.stringify({
              reason,
              sourceTopic,
              sourcePartition: partition,
              service: 'admin-service',
              failedAt: new Date().toISOString(),
              rawEvent,
            }),
          },
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to publish DLQ event: ${this.errorMessage(error)}`);
    }
  }
}
