import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { AdminRedisClient, connectGeneralAdminRedis } from "./redis-config.util";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: AdminRedisClient | null = null;

  async onModuleInit(): Promise<void> {
    try {
      const { client, logLabel } = await connectGeneralAdminRedis();
      this.client = client;
      this.client.on("error", (err: Error) => this.logger.warn(`Redis: ${err.message}`));
      this.logger.log(`Redis connected mode=${logLabel}`);
    } catch (err) {
      this.logger.warn(`Redis unavailable: ${(err as Error).message}. Running without cache.`);
      this.client = null;
    }
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

  async set(key: string, data: unknown, ttl = 3600): Promise<void> {
    try {
      if (!this.isConnected()) return;
      const payload = JSON.stringify(data);
      if (ttl > 0) {
        await this.client!.set(key, payload, { EX: ttl });
      } else {
        await this.client!.set(key, payload);
      }
    } catch (err) {
      this.logger.warn(`Redis set error: ${(err as Error).message}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected()) return null;
      const val = await this.client!.get(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      this.logger.warn(`Redis get error: ${(err as Error).message}`);
    }
    return null;
  }

  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected()) return;
      await this.client!.del(key);
    } catch (err) {
      this.logger.warn(`Redis del error: ${(err as Error).message}`);
    }
  }

  async publish(channel: string, message = "1"): Promise<void> {
    try {
      if (!this.isConnected()) return;
      await this.client!.publish(channel, message);
    } catch (err) {
      this.logger.warn(`Redis publish error: ${(err as Error).message}`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      if (!this.isConnected()) return;
      for await (const key of this.client!.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        await this.client!.del(key);
      }
    } catch (err) {
      this.logger.warn(`Redis delByPattern error: ${(err as Error).message}`);
    }
  }

  getClient(): AdminRedisClient | null {
    return this.client;
  }
}
