import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { AdminRedisClient, connectGeneralAdminRedis } from "../redis/redis-config.util";

const BLACKLIST_KEY_PREFIX = "token:blacklist:";

@Injectable()
export class TokenBlacklistService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private client: AdminRedisClient | null = null;

  async onModuleInit(): Promise<void> {
    try {
      const { client, logLabel } = await connectGeneralAdminRedis();
      this.client = client;
      this.client.on("error", (err: Error) => this.logger.warn(`Redis: ${err.message}`));
      this.logger.log(`Token blacklist Redis connected mode=${logLabel}`);
    } catch (err) {
      this.logger.warn(`Redis unavailable: ${(err as Error).message}. Blacklist write disabled.`);
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

  async isBlacklisted(jti: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const key = `${BLACKLIST_KEY_PREFIX}${jti}`;
      const val = await this.client.get(key);
      return val === "1";
    } catch (err) {
      this.logger.warn(`Blacklist check failed: ${(err as Error).message}`);
      return false;
    }
  }

  async addToBlacklist(jti: string, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try {
      const key = `${BLACKLIST_KEY_PREFIX}${jti}`;
      await this.client.set(key, "1", { EX: Math.max(1, ttlSeconds) });
    } catch (err) {
      this.logger.warn(`Blacklist write failed: ${(err as Error).message}`);
    }
  }
}
