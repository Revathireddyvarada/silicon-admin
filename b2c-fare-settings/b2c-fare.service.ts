import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { B2cKmFareSettings } from "../entities/b2c-km-fare-settings.entity";
import { B2cTripSettings } from "../entities/b2c-trip-settings.entity";
import {
  BulkUpsertB2cKmFareDto,
  UpsertB2cTripSettingsDto,
} from "./dto/b2c-fare.dto";

@Injectable()
export class B2cFareService {
  constructor(
    @InjectRepository(B2cKmFareSettings)
    private readonly kmFareRepo: Repository<B2cKmFareSettings>,

    @InjectRepository(B2cTripSettings)
    private readonly tripRepo: Repository<B2cTripSettings>,
  ) {}

  async upsertKmFares(
    dto: BulkUpsertB2cKmFareDto,
    currentUserId?: string,
  ): Promise<B2cKmFareSettings[]> {
    await this.kmFareRepo
      .createQueryBuilder()
      .update(B2cKmFareSettings)
      .set({ isDeleted: true, updatedBy: currentUserId ?? null })
      .where("is_deleted = false")
      .execute();

    const entities = dto.fares.map((fare) =>
      this.kmFareRepo.create({
        ...fare,
        kmRangeTo: fare.kmRangeTo ?? null,
        isDeleted: false,
        createdBy: currentUserId ?? null,
        updatedBy: currentUserId ?? null,
      }),
    );
    return this.kmFareRepo.save(entities);
  }

  async findAllKmFares(): Promise<object> {
    const fares = await this.kmFareRepo.find({
      where: { isDeleted: false },
      order: { kmRangeFrom: "ASC", vehicleType: "ASC", acType: "ASC" },
    });

    const grouped = fares.reduce<Record<string, B2cKmFareSettings[]>>(
      (acc, fare) => {
        const key = fare.kmRangeTo
          ? `${fare.kmRangeFrom}-${fare.kmRangeTo}`
          : `${fare.kmRangeFrom}+`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(fare);
        return acc;
      },
      {},
    );

    return grouped;
  }

  async upsertTripSettings(
    dto: UpsertB2cTripSettingsDto,
    currentUserId?: string,
  ): Promise<B2cTripSettings> {
    const existing = await this.tripRepo.findOne({
      where: { isDeleted: false },
    });

    if (existing) {
      Object.assign(existing, dto);
      existing.updatedBy = currentUserId ?? null;
      return this.tripRepo.save(existing);
    }

    const entity = this.tripRepo.create({
      ...dto,
      nightChargeType: dto.nightChargeType ?? null,
      nightChargeValue: dto.nightChargeValue ?? null,
      isDeleted: false,
      createdBy: currentUserId ?? null,
      updatedBy: currentUserId ?? null,
    });
    return this.tripRepo.save(entity);
  }

  async findTripSettings(): Promise<B2cTripSettings> {
    const entity = await this.tripRepo.findOne({
      where: { isDeleted: false },
    });
    if (!entity) throw new NotFoundException("B2C trip settings not found");
    return entity;
  }
}
