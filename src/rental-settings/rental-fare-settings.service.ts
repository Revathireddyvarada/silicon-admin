import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RentalPackage } from "../entities/rental-package.entity";
import { RentalFareSettings } from "../entities/rental-fare-settings.entity";
import { RentalTripSettings } from "../entities/rental-trip-settings.entity";
import {
  CreateRentalPackageDto,
  UpdateRentalPackageDto,
  BulkUpsertRentalFareDto,
  UpsertRentalTripSettingsDto,
} from "./dto/rental-fare-settings.dto";

@Injectable()
export class RentalFareService {
  constructor(
    @InjectRepository(RentalPackage)
    private readonly packageRepo: Repository<RentalPackage>,

    @InjectRepository(RentalFareSettings)
    private readonly fareRepo: Repository<RentalFareSettings>,

    @InjectRepository(RentalTripSettings)
    private readonly tripRepo: Repository<RentalTripSettings>,
  ) {}

  // ─────────────────────────────────────────
  // RENTAL PACKAGES
  // ─────────────────────────────────────────

  async createPackage(
    dto: CreateRentalPackageDto,
    currentUserId?: string,
  ): Promise<RentalPackage> {
    const entity = this.packageRepo.create({
      ...dto,
      isActive: dto.isActive ?? true,
      isDeleted: false,
      createdBy: currentUserId ?? null,
      updatedBy: currentUserId ?? null,
    });
    return this.packageRepo.save(entity);
  }

  async findAllPackages(): Promise<RentalPackage[]> {
    return this.packageRepo.find({
      where: { isDeleted: false },
      order: { hours: "ASC" },
    });
  }

  async updatePackage(
    id: string,
    dto: UpdateRentalPackageDto,
    currentUserId?: string,
  ): Promise<RentalPackage> {
    const entity = await this.packageRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!entity) throw new NotFoundException(`Rental package ${id} not found`);
    Object.assign(entity, dto);
    entity.updatedBy = currentUserId ?? null;
    return this.packageRepo.save(entity);
  }

  async removePackage(
    id: string,
    currentUserId?: string,
  ): Promise<{ message: string }> {
    const entity = await this.packageRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!entity) throw new NotFoundException(`Rental package ${id} not found`);
    entity.isDeleted = true;
    entity.updatedBy = currentUserId ?? null;
    await this.packageRepo.save(entity);
    return { message: "Rental package deleted successfully" };
  }

  // ─────────────────────────────────────────
  // RENTAL FARE SETTINGS
  // ─────────────────────────────────────────

  async upsertFares(
    dto: BulkUpsertRentalFareDto,
    currentUserId?: string,
  ): Promise<RentalFareSettings[]> {
    await this.fareRepo
      .createQueryBuilder()
      .update(RentalFareSettings)
      .set({ isDeleted: true, updatedBy: currentUserId ?? null })
      .where("is_deleted = false")
      .execute();

    const entities = dto.fares.map((fare) =>
      this.fareRepo.create({
        ...fare,
        isDeleted: false,
        createdBy: currentUserId ?? null,
        updatedBy: currentUserId ?? null,
      }),
    );
    return this.fareRepo.save(entities);
  }

  async findAllFares(): Promise<RentalFareSettings[]> {
    return this.fareRepo.find({
      where: { isDeleted: false },
      order: { vehicleType: "ASC" },
    });
  }

  // ─────────────────────────────────────────
  // RENTAL TRIP SETTINGS
  // ─────────────────────────────────────────

  async upsertTripSettings(
    dto: UpsertRentalTripSettingsDto,
    currentUserId?: string,
  ): Promise<RentalTripSettings> {
    const existing = await this.tripRepo.findOne({
      where: { isDeleted: false },
    });

    if (existing) {
      Object.assign(existing, dto);
      existing.nightChargeType = dto.nightChargeType ?? null;
      existing.nightChargeValue = dto.nightChargeValue ?? null;
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

  async findTripSettings(): Promise<RentalTripSettings> {
    const entity = await this.tripRepo.findOne({ where: { isDeleted: false } });
    if (!entity) throw new NotFoundException("Rental trip settings not found");
    return entity;
  }
}
