export const KAFKA_TOPIC_TRIP_EVENTS = 'trip.events.v1';

export type TripEventType = 'TRIP_CREATED' | 'TRIP_ACCEPTED' | 'TRIP_STATUS_CHANGED';

export interface TripEventEnvelope<TPayload> {
  eventId: string;
  eventType: TripEventType;
  occurredAt: string;
  version: 'v1';
  payload: TPayload;
}

export interface TripCreatedPayload {
  tripId: string;
  /** Business trip reference (`trips.trip_id`); shown in notifications instead of UUID. */
  tripDisplayId?: string;
  riderId: string;
  vendorId?: string;
  vendorFirstName?: string;
  vendorLastName?: string;
  fleetId?: string;
  status: string;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  reservedAmount?: number;
  stateId?: string;
  cityId?: string;
  zoneId?: string;
  countDate?: string;
  tripAmount?: number;
  driverAmount?: number;
  adminAmount?: number;
  vendorAmount?: number;
}

export interface TripAcceptedPayload {
  tripId: string;
  tripDisplayId?: string;
  driverId: string;
  driverName?: string;
  vendorId?: string;
  fleetId?: string;
  acceptedAt: string;
}

export interface TripStatusChangedPayload {
  tripId: string;
  tripDisplayId?: string;
  vendorId?: string;
  driverId?: string;
  driverName?: string;
  previousStatus: string;
  status: string;
  changedAt: string;
  isForced?: boolean;
  stateId?: string;
  cityId?: string;
  zoneId?: string;
  countDate?: string;
}
