import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DispatchSettings } from "../entities/dispatch-settings.entity";
import { UpsertDispatchSettingsDto } from "./dto/dispatch-settings.dto";
import { DispatchRedisService } from "../redis/dispatch-redis.service";
import { resolveDispatchRedisDb } from "../redis/redis-config.util";

/** Shared with ride-service — updated on every admin save/delete. */
export const DISPATCH_SETTINGS_REDIS_KEY = "dispatch:settings";
/** Pub/sub — ride-service reloads in-memory config on this channel. */
export const DISPATCH_SETTINGS_UPDATED_CHANNEL = "dispatch:settings:updated";

@Injectable()
export class DispatchSettingsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DispatchSettingsService.name);

  constructor(
    @InjectRepository(DispatchSettings)
    private readonly repo: Repository<DispatchSettings>,
    private readonly dispatchRedis: DispatchRedisService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const entity = await this.repo.findOne({ where: { isDeleted: false } });
      if (entity) await this.syncToRedis(entity);
    } catch (err) {
      this.logger.warn(
        `Dispatch settings Redis warm-up skipped: ${(err as Error).message}`,
      );
    }
  }

  async upsert(dto: UpsertDispatchSettingsDto): Promise<DispatchSettings> {
    const existing = await this.repo.findOne({ where: { isDeleted: false } });

    let saved: DispatchSettings;
    if (existing) {
      Object.assign(existing, dto);
      saved = await this.repo.save(existing);
    } else {
      const entity = this.repo.create({
        ...dto,
        isDeleted: false,
      });
      saved = await this.repo.save(entity);
    }

    await this.syncToRedis(saved);
    return saved;
  }

  async findOne(): Promise<DispatchSettings> {
    const entity = await this.repo.findOne({ where: { isDeleted: false } });
    if (!entity) throw new NotFoundException("Dispatch settings not found");
    return entity;
  }

  async remove(): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { isDeleted: false } });
    if (!entity) throw new NotFoundException("Dispatch settings not found");
    entity.isDeleted = true;
    await this.repo.save(entity);
    await this.dispatchRedis.del(DISPATCH_SETTINGS_REDIS_KEY);
    await this.dispatchRedis.publish(DISPATCH_SETTINGS_UPDATED_CHANNEL);
    return { message: "Dispatch settings deleted successfully" };
  }

  private async syncToRedis(entity: DispatchSettings): Promise<void> {
    const db = resolveDispatchRedisDb();
    const ok = await this.dispatchRedis.set(
      DISPATCH_SETTINGS_REDIS_KEY,
      {
        geoSearchRadiusKm: Number(entity.geoSearchRadiusKm),
        pickupEtaSpeedKmh: Number(entity.pickupEtaSpeedKmh),
        pickupEtaBufferMinutes: Number(entity.pickupEtaBufferMinutes),
        updatedAt: entity.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      },
      0,
    );

    if (!ok) {
      this.logger.error(
        `Failed to sync dispatch settings to Redis db=${db} key=${DISPATCH_SETTINGS_REDIS_KEY}. ` +
          `Check REDIS_HOST/REDIS_URL, REDIS_PASSWORD, LOCATION_DISPATCH_REDIS_DB=${db}`,
      );
      return;
    }

    this.logger.log(
      `Dispatch settings synced to Redis db=${db} key=${DISPATCH_SETTINGS_REDIS_KEY}`,
    );
    await this.dispatchRedis.publish(DISPATCH_SETTINGS_UPDATED_CHANNEL);
  }
}
