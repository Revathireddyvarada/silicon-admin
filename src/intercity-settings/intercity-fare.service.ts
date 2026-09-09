import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InterCityFareSettings } from "../entities/intercity-fare-settings.entity";
import { InterCityTripSettings } from "../entities/intercity-trip-settings.entity";
import {
  BulkUpsertB2cKmFareDto,
  UpsertInterCityTripSettingsDto,
} from "./dto/intercity-fare.dto";

@Injectable()
export class InterCityFareService {
  constructor(
    @InjectRepository(InterCityFareSettings)
    private readonly kmFareRepo: Repository<InterCityFareSettings>,

    @InjectRepository(InterCityTripSettings)
    private readonly tripRepo: Repository<InterCityTripSettings>,
  ) {}

  async upsertKmFares(
    dto: BulkUpsertB2cKmFareDto,
    currentUserId?: string,
  ): Promise<InterCityFareSettings[]> {
    await this.kmFareRepo
      .createQueryBuilder()
      .update(InterCityFareSettings)
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

    const grouped = fares.reduce<Record<string, InterCityFareSettings[]>>(
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
    dto: UpsertInterCityTripSettingsDto,
    currentUserId?: string,
  ): Promise<InterCityTripSettings> {
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

  async findTripSettings(): Promise<InterCityTripSettings> {
    const entity = await this.tripRepo.findOne({
      where: { isDeleted: false },
    });
    if (!entity)
      throw new NotFoundException("Intercity trip settings not found");
    return entity;
  }
}
