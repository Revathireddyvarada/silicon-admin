import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PricingTier } from "../entities/pricing-tier.entity";
import { CreatePricingTierDto } from "./dto/create-pricing-tier.dto";
import { UpdatePricingTierDto } from "./dto/update-pricing-tier.dto";
import { CitiesService } from "../cities/cities.service";
import { VehicleTypesService } from "../vehicle-types/vehicle-types.service";

@Injectable()
export class PricingTiersService {
  constructor(
    @InjectRepository(PricingTier)
    private readonly repo: Repository<PricingTier>,
    @Inject(CitiesService) private readonly citiesService: CitiesService,
    @Inject(VehicleTypesService) private readonly vehicleTypesService: VehicleTypesService,
  ) {}

  async create(dto: CreatePricingTierDto): Promise<PricingTier> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const name = dto.name?.trim();
    const cityId = dto.cityId?.trim();
    const vehicleTypeId = dto.vehicleTypeId?.trim();

    if (!name) throw new BadRequestException("name is required and must not be empty");
    if (!cityId || !uuidRegex.test(cityId)) throw new BadRequestException("cityId is required and must be a valid UUID");
    if (!vehicleTypeId || !uuidRegex.test(vehicleTypeId)) throw new BadRequestException("vehicleTypeId is required and must be a valid UUID");

    const baseFare = Number(dto.baseFare);
    const perKmRate = Number(dto.perKmRate);
    const perMinuteRate = Number(dto.perMinuteRate);
    if (dto.baseFare == null || dto.baseFare as any === "" || Number.isNaN(baseFare) || baseFare < 0) {
      throw new BadRequestException("baseFare is required and must be at least 0");
    }
    if (dto.perKmRate == null || dto.perKmRate as any === "" || Number.isNaN(perKmRate) || perKmRate < 0) {
      throw new BadRequestException("perKmRate is required and must be at least 0");
    }
    if (dto.perMinuteRate == null || dto.perMinuteRate as any === "" || Number.isNaN(perMinuteRate) || perMinuteRate < 0) {
      throw new BadRequestException("perMinuteRate is required and must be at least 0");
    }

    await this.citiesService.findOne(cityId);
    await this.vehicleTypesService.findOne(vehicleTypeId);

    const existingByCityVehicle = await this.repo.findOne({
      where: { cityId, vehicleTypeId },
    });
    if (existingByCityVehicle) {
      throw new ConflictException("Pricing tier for this city and vehicle type already exists");
    }

    const existingByName = await this.repo
      .createQueryBuilder("pt")
      .where("LOWER(TRIM(pt.name)) = LOWER(:name)", { name })
      .andWhere("pt.city_id = :cityId", { cityId })
      .getOne();
    if (existingByName) {
      throw new ConflictException(`Pricing tier with name ${name} already exists in this city`);
    }

    const entity = this.repo.create({
      name,
      cityId,
      vehicleTypeId,
      baseFare,
      perKmRate,
      perMinuteRate,
      currency: dto.currency ?? "INR",
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(entity);
  }

  async findAll(cityId?: string, vehicleTypeId?: string, isActive?: boolean): Promise<PricingTier[]> {
    const qb = this.repo
      .createQueryBuilder("pt")
      .leftJoinAndSelect("pt.city", "city")
      .leftJoinAndSelect("pt.vehicleType", "vehicleType")
      .orderBy("pt.name", "ASC");

    if (cityId) qb.andWhere("pt.cityId = :cityId", { cityId });
    if (vehicleTypeId) qb.andWhere("pt.vehicleTypeId = :vehicleTypeId", { vehicleTypeId });
    if (isActive != null) qb.andWhere("pt.isActive = :isActive", { isActive });

    return qb.getMany();
  }

  async findOne(id: string): Promise<PricingTier> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ["city", "vehicleType"],
    });
    if (!entity) throw new NotFoundException(`Pricing tier ${id} not found`);
    return entity;
  }

  async update(id: string, dto: UpdatePricingTierDto): Promise<PricingTier> {
    const entity = await this.findOne(id);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (dto.cityId !== undefined) {
      const cid = dto.cityId?.trim();
      if (!cid || !uuidRegex.test(cid)) throw new BadRequestException("cityId must be a valid UUID when provided");
      await this.citiesService.findOne(cid);
    }
    if (dto.vehicleTypeId !== undefined) {
      const vid = dto.vehicleTypeId?.trim();
      if (!vid || !uuidRegex.test(vid)) throw new BadRequestException("vehicleTypeId must be a valid UUID when provided");
      await this.vehicleTypesService.findOne(vid);
    }

    if (dto.cityId || dto.vehicleTypeId) {
      const cid = (dto.cityId?.trim() || entity.cityId);
      const vid = (dto.vehicleTypeId?.trim() || entity.vehicleTypeId);
      const existingByCityVehicle = await this.repo.findOne({ where: { cityId: cid, vehicleTypeId: vid } });
      if (existingByCityVehicle && existingByCityVehicle.id !== id) {
        throw new ConflictException("Pricing tier for this city and vehicle type already exists");
      }
    }

    if (dto.name !== undefined) {
      const name = dto.name.toString().trim();
      if (!name) throw new BadRequestException("name must not be empty when provided");
      const cityId = dto.cityId?.trim() ?? entity.cityId;
      const existingByName = await this.repo
        .createQueryBuilder("pt")
        .where("LOWER(TRIM(pt.name)) = LOWER(:name)", { name })
        .andWhere("pt.city_id = :cityId", { cityId })
        .andWhere("pt.id != :id", { id })
        .getOne();
      if (existingByName) {
        throw new ConflictException(`Pricing tier with name ${name} already exists in this city`);
      }
    }

    if (dto.baseFare !== undefined) {
      const v = Number(dto.baseFare);
      if (Number.isNaN(v) || v < 0) throw new BadRequestException("baseFare must be at least 0");
    }
    if (dto.perKmRate !== undefined) {
      const v = Number(dto.perKmRate);
      if (Number.isNaN(v) || v < 0) throw new BadRequestException("perKmRate must be at least 0");
    }
    if (dto.perMinuteRate !== undefined) {
      const v = Number(dto.perMinuteRate);
      if (Number.isNaN(v) || v < 0) throw new BadRequestException("perMinuteRate must be at least 0");
    }

    const updates: Partial<PricingTier> = { ...dto };
    if (dto.cityId !== undefined) updates.cityId = dto.cityId.trim();
    if (dto.vehicleTypeId !== undefined) updates.vehicleTypeId = dto.vehicleTypeId.trim();
    if (dto.name !== undefined) updates.name = dto.name.toString().trim();
    Object.assign(entity, updates);
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
  }
}
