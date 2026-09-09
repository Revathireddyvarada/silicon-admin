import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VehicleType } from "../entities/vehicle-type.entity";
import { CreateVehicleTypeDto } from "./dto/create-vehicle-type.dto";
import { UpdateVehicleTypeDto } from "./dto/update-vehicle-type.dto";
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { RedisService } from "../redis/redis.service";

const logger = new Logger('VehicleTypeService');

@Injectable()
export class VehicleTypesService {
  constructor(
    @InjectRepository(VehicleType)
    private readonly repo: Repository<VehicleType>,
    private readonly redis: RedisService,
  ) {}

  async create(dto: CreateVehicleTypeDto,userId: string): Promise<VehicleType> {
    const vehicle_type_name = dto.vehicle_type_name?.trim();
    if (!vehicle_type_name) throw new BadRequestException("vehicle_type_name is required and must not be empty");
    const seat_count = Number(dto.seat_count);
    if (dto.seat_count == null || Number.isNaN(seat_count) || seat_count < 1 || seat_count > 20) {
      throw new BadRequestException("seat_count is required and must be between 1 and 20");
    }
    const existing = await this.repo
      .createQueryBuilder("vt")
      .where("LOWER(TRIM(vt.vehicle_type_name)) = LOWER(:vehicle_type_name)", { vehicle_type_name })
      .andWhere("vt.type = :type", { type: dto.type })
      .andWhere("vt.seat_count = :seat_count", { seat_count }) 
      .andWhere("vt.is_deleted = false")
      .getOne();

    if (existing) {
      throw new ConflictException(`Vehicle type already exists`);
    }
    const entity = this.repo.create({
      vehicle_type_name,
      seat_count,
      type: dto.type,
      status: dto.status ?? true,
      created_by:userId,
      updated_by:userId,
    });
    const saved = await this.repo.save(entity);
    await this.redis.delByPattern(`vehicle_types:*`);
    return { 
          id: saved.id,
          vehicle_type_name: saved.vehicle_type_name,
          type: saved.type,
          seat_count: saved.seat_count,
          status: saved.status,
        } as VehicleType;
  }

    async findAll(query: FindAllQueryDto) {
    const {
      status,
      search,
      page = 1,
      limit = 10,
    } = query;

    const qb = this.repo
      .createQueryBuilder("vt")
      .select([
        "vt.id",
        "vt.vehicle_type_name",
        "vt.type",
        "vt.seat_count",
        "vt.status",
        "vt.created_at",
      ])
      .where("vt.is_deleted = false");

    if (status !== undefined) {
      qb.andWhere("vt.status = :status", { status });
    }

    if (search?.trim()) {
      qb.andWhere(
        `LOWER(vt.vehicle_type_name) LIKE LOWER(:search)`,
        { search: `%${search.trim()}%` },
      );
    }

    qb.orderBy("vt.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<VehicleType> {
    const entity = await this.repo.createQueryBuilder("m")
      .select([
        "m.id",
        "m.vehicle_type_name",
        "m.type",
        "m.seat_count",
        "m.status",
      ])
      .where("m.id = :id", { id })
      .andWhere("m.is_deleted = false")
      .getOne();
    if (!entity) throw new NotFoundException(`Vehicle type not found`);

    return entity;
  }

  async update(id: string, dto: UpdateVehicleTypeDto, userId:string): Promise<VehicleType> {
    const entity = await this.findOne(id);
    const vehicle_type_name = dto.vehicle_type_name?.trim() ?? entity.vehicle_type_name;
    const type = dto.type ?? entity.type;
    const seat_count = dto.seat_count ?? entity.seat_count;

    if (dto.vehicle_type_name || dto.type || dto.seat_count) {
      const existing = await this.repo.createQueryBuilder("vt")
        .select([
          "vt.id",
        ])
        .where("LOWER(TRIM(vt.vehicle_type_name)) = LOWER(:vehicle_type_name)", { vehicle_type_name })
        .andWhere("vt.type = :type", { type })
        .andWhere("vt.seat_count = :seat_count", { seat_count })
        .andWhere("vt.id != :id", { id })
        .andWhere("vt.is_deleted = false") 
        .getOne();

      if (existing) {
        throw new ConflictException(`Vehicle type already exists`);
      }
    }

    Object.assign(entity, dto, { updated_by: userId });
    const updated = await this.repo.save(entity);

    await this.redis.delByPattern(`vehicle_types:*`);
    return {
      id: updated.id,
      vehicle_type_name: updated.vehicle_type_name,
      type: updated.type,
      seat_count: updated.seat_count,
      status: updated.status,
    } as VehicleType;
  }

  async getAllActiveVehicleTypes() {
    const cacheKey = `vehicle_types:all`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const items = await this.repo.find({
      where: { status: true, is_deleted: false },
      order: { vehicle_type_name: "ASC" },
      select: ["id", "vehicle_type_name", "type", "seat_count"],
    });

    await this.redis.set(cacheKey, items, 3600);
    return items;
  }

  async remove(id: string): Promise<void> {
    await this.repo.update(id, { status: false, is_deleted: true });
    await this.redis.delByPattern(`vehicle_types:*`);
  }
}
