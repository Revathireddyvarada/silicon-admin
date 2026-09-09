import { Injectable, NotFoundException, ConflictException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TripRatingReason } from "../entities/trip-rating-reason.entity";
import { CreateTripRatingReasonDto } from "./dto/create-trip-rating-reason.dto";
import { UpdateTripRatingReasonDto } from "./dto/update-trip-rating-reason.dto";
import { FindAllQueryDto } from "./dto/find-all-query.dto";
import { RedisService } from "../redis/redis.service";

const CACHE_KEY = "trip-rating-reasons:all";

@Injectable()
export class TripRatingReasonsService {
  constructor(
    @InjectRepository(TripRatingReason)
    private readonly repo: Repository<TripRatingReason>,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async create(dto: CreateTripRatingReasonDto, userId: string): Promise<TripRatingReason> {
    const reason = (dto.reason ?? "").toString().trim();
    if (reason) {
      const existingByName = await this.repo
        .createQueryBuilder("s")
        .where("LOWER(TRIM(s.reason)) = LOWER(:reason)", { reason })
        .andWhere("s.is_deleted = false")
        .getOne();
      if (existingByName) {
        throw new ConflictException(`Reason already exists`);
      }
    }
    const entity = this.repo.create({
      ...dto,
      created_by: userId,
      updated_by: userId,
      status: dto.status ?? true,
    });
    const saved = await this.repo.save(entity);
    await this.redis.del(CACHE_KEY);
    return {
      id: saved.id,
      reason: saved.reason,
      description: saved.description,
      status: saved.status,
    } as TripRatingReason;
  }

  async findAll(query: FindAllQueryDto) {
    const { status, page = 1, limit = 10, search } = query;

    const qb = this.repo.createQueryBuilder("c")
      .select([
        "c.id",
        "c.reason",
        "c.status",
        "c.created_at",
        "c.description",
      ])
      .where("c.is_deleted = false")
      .orderBy("c.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (status != null) qb.andWhere("c.status = :status", { status });
    if (search) qb.andWhere("LOWER(TRIM(c.reason)) LIKE LOWER(:search)",
      { search: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();
    const result = { items, meta: { total, page, limit } };
    return result;
  }

  async findOne(id: string): Promise<TripRatingReason> {
    const entity = await this.repo.createQueryBuilder("c")
      .select([
        "c.id",
        "c.reason",
        "c.description",
        "c.status",
        "c.created_at",
      ])
      .where("c.id = :id", { id })
      .andWhere("c.is_deleted = false")
      .getOne();
    if (!entity) throw new NotFoundException(`Reason not found`);

    return entity;
  }

  async update(id: string, dto: UpdateTripRatingReasonDto, userId: string): Promise<TripRatingReason> {
    const entity = await this.findOne(id);
    const reason = dto.reason?.trim() ?? entity.reason;
    if (dto.reason) {
      const existing = await this.repo.createQueryBuilder("s")
        .select([
          "s.id",
        ])
        .where("LOWER(TRIM(s.reason)) = LOWER(:reason)", { reason })
        .andWhere("s.id != :id", { id })
        .andWhere("s.is_deleted = false")
        .getOne();
      if (existing) throw new ConflictException(`Reason already exists`);
    }
    Object.assign(entity, dto, { updated_by: userId });
    const updated = await this.repo.save(entity);

    await this.redis.del(CACHE_KEY);
    return {
      id: updated.id,
      reason: updated.reason,
      description: updated.description,
      status: updated.status,
    } as TripRatingReason;
  }

  async getAllActive() {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) return cached;

    const items = await this.repo.find({
      where: { status: true, is_deleted: false },
      order: { reason: "ASC" },
      select: ["id", "reason"],
    });

    await this.redis.set(CACHE_KEY, items, 3600);
    return items;
  }

  async remove(id: string): Promise<void> {
    await this.repo.update(id, { status: false, is_deleted: true });
    await this.redis.del(CACHE_KEY);
  }
}
