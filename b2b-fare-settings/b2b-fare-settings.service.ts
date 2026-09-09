import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { B2bFareSettings } from "../entities/b2b-fare-settings.entity";
import { UpsertB2bFareSettingsDto } from "./dto/b2b-fare-settings.dto";
import { RedisService } from "../redis/redis.service";

/** Shared with ride-service — updated on every admin save. */
export const B2B_FARE_SETTINGS_REDIS_KEY = "b2b:fare-settings";

@Injectable()
export class B2bFareSettingsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(B2bFareSettingsService.name);

  constructor(
    @InjectRepository(B2bFareSettings)
    private readonly repo: Repository<B2bFareSettings>,
    private readonly redis: RedisService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const entity = await this.repo.findOne({ where: { isDeleted: false } });
      if (entity) await this.syncToRedis(entity);
    } catch (err) {
      this.logger.warn(
        `B2B fare settings Redis warm-up skipped: ${(err as Error).message}`,
      );
    }
  }

  async upsert(
    dto: UpsertB2bFareSettingsDto,
    currentUserId?: string,
  ): Promise<B2bFareSettings> {
    const existing = await this.repo.findOne({
      where: { isDeleted: false },
    });

    let saved: B2bFareSettings;
    if (existing) {
      existing.gstPercentage = dto.gstPercentage;
      existing.platformFeeType = dto.platformFeeType;
      existing.platformFeeValue = dto.platformFeeValue;
      existing.noShowDriverCommissionAbove500 =
        dto.noShowDriverCommissionAbove500;
      existing.noShowDriverCommissionBelow500 =
        dto.noShowDriverCommissionBelow500;
      existing.updatedBy = currentUserId ?? null;
      saved = await this.repo.save(existing);
    } else {
      const entity = this.repo.create({
        ...dto,
        isDeleted: false,
        createdBy: currentUserId ?? null,
        updatedBy: currentUserId ?? null,
      });
      saved = await this.repo.save(entity);
    }

    await this.syncToRedis(saved);
    return saved;
  }

  async findOne(): Promise<B2bFareSettings> {
    const entity = await this.repo.findOne({
      where: { isDeleted: false },
    });
    if (!entity) throw new NotFoundException("B2B fare settings not found");
    return entity;
  }

  private async syncToRedis(entity: B2bFareSettings): Promise<void> {
    const payload = {
      id: entity.id,
      gstPercentage: Number(entity.gstPercentage),
      platformFeeType: entity.platformFeeType,
      platformFeeValue: Number(entity.platformFeeValue),
      noShowDriverCommissionAbove500: Number(
        entity.noShowDriverCommissionAbove500,
      ),
      noShowDriverCommissionBelow500: Number(
        entity.noShowDriverCommissionBelow500,
      ),
      updatedAt: entity.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };

    // Persist without TTL — overwritten on every admin upsert (same as dispatch settings).
    await this.redis.set(B2B_FARE_SETTINGS_REDIS_KEY, payload, 0);
    this.logger.log(
      `B2B fare settings synced to Redis key=${B2B_FARE_SETTINGS_REDIS_KEY}`,
    );
  }
}
