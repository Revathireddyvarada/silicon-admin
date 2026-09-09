import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  AdminRedisClient,
  connectDispatchRedis,
  resolveDispatchRedisDb,
} from "./redis-config.util";

@Injectable()
export class DispatchRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DispatchRedisService.name);
  private client: AdminRedisClient | null = null;
  private connectPromise: Promise<void> | null = null;

  async onModuleInit(): Promise<void> {
    await this.ensureConnected();
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.quit();
    } catch {
      // ignore — shutdown must not hang on a dead Redis socket
    }
    this.client = null;
  }

  isConnected(): boolean {
    return this.client?.isOpen ?? false;
  }

  private async ensureConnected(): Promise<void> {
    if (this.isConnected()) return;
    if (!this.connectPromise) {
      this.connectPromise = this.connect();
    }
    await this.connectPromise;
  }

  private async connect(): Promise<void> {
    try {
      const db = resolveDispatchRedisDb();
      const { client, logLabel } = await connectDispatchRedis();
      this.client = client;
      this.client.on("error", (err: Error) => this.logger.warn(`Redis: ${err.message}`));
      this.logger.log(`Dispatch Redis connected LOCATION_DISPATCH_REDIS_DB=${db} mode=${logLabel}`);
    } catch (err) {
      this.connectPromise = null;
      this.logger.error(
        `Dispatch Redis connection FAILED (LOCATION_DISPATCH_REDIS_DB=${resolveDispatchRedisDb()}): ${(err as Error).message}`,
      );
      this.client = null;
    }
  }

  async set(key: string, data: unknown, ttl = 0): Promise<boolean> {
    try {
      await this.ensureConnected();
      if (!this.isConnected()) {
        this.logger.error(`Dispatch Redis set skipped — not connected (key=${key})`);
        return false;
      }
      const payload = JSON.stringify(data);
      if (ttl > 0) {
        await this.client!.set(key, payload, { EX: ttl });
      } else {
        await this.client!.set(key, payload);
      }
      return true;
    } catch (err) {
      this.logger.error(`Dispatch Redis set error (key=${key}): ${(err as Error).message}`);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      if (!this.isConnected()) return false;
      await this.client!.del(key);
      return true;
    } catch (err) {
      this.logger.error(`Dispatch Redis del error (key=${key}): ${(err as Error).message}`);
      return false;
    }
  }

  async publish(channel: string, message = "1"): Promise<boolean> {
    try {
      await this.ensureConnected();
      if (!this.isConnected()) return false;
      await this.client!.publish(channel, message);
      return true;
    } catch (err) {
      this.logger.error(`Dispatch Redis publish error (channel=${channel}): ${(err as Error).message}`);
      return false;
    }
  }

  getClient(): AdminRedisClient | null {
    return this.client;
  }
}
