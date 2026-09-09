import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Model } from "../entities/model.entity";
import { CreateModelDto } from "./dto/create-model.dto";
import { UpdateModelDto } from "./dto/update-model.dto";
import { FindAllQueryDto } from "./dto/find-all-query.dto";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model)
    private readonly repo: Repository<Model>,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async create(dto: CreateModelDto, userId: string): Promise<Model> {
    const name = (dto.model_name ?? "").toString().trim();
    if (name) {
      const existingByName = await this.repo
        .createQueryBuilder("m")
        .where("LOWER(TRIM(m.model_name)) = LOWER(:name)", { name })
        .andWhere("m.brand_id = :brand_id", { brand_id: dto.brand_id })
        .andWhere("m.is_deleted = false")
        .getOne();
      if (existingByName) {
        throw new ConflictException(
          `Model with name ${dto.model_name} already exists for this brand`,
        );
      }
    }
    const entity = this.repo.create({
      ...dto,
      created_by: userId,
      updated_by: userId,
      status: dto.status ?? true,
    });
    const saved = await this.repo.save(entity);
    await this.redis.delByPattern(`models:*`);
    return {
      id: saved.id,
      model_name: saved.model_name,
      brand_id: saved.brand_id,
      status: saved.status,
    } as Model;
  }

  async findAll(query: FindAllQueryDto) {
    const { status, page = 1, limit = 10, search } = query;

    const qb = this.repo
      .createQueryBuilder("m")
      .select([
        "m.id",
        "m.model_name",
        "m.status",
        "m.created_at",
        "b.id",
        "b.brand_name",
      ])
      .leftJoin("m.brand", "b")
      .where("m.is_deleted = false")
      .orderBy("m.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (status != null) qb.andWhere("m.status = :status", { status });
    if (search)
      qb.andWhere("LOWER(TRIM(m.model_name)) LIKE LOWER(:search)", {
        search: `%${search}%`,
      });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string): Promise<Model> {
    const entity = await this.repo
      .createQueryBuilder("m")
      .select([
        "m.id",
        "m.model_name",
        "m.brand_id",
        "m.status",
        "b.id",
        "b.brand_name",
      ])
      .leftJoin("m.brand", "b")
      .where("m.id = :id", { id })
      .andWhere("m.is_deleted = false")
      .getOne();
    if (!entity) throw new NotFoundException(`Model ${id} not found`);
    return entity;
  }

  async findByBrand(brandId: string, query: FindAllQueryDto) {
    const { status, search } = query;

    const qb = this.repo
      .createQueryBuilder("m")
      .select(["m.id", "m.model_name"])
      .where("m.is_deleted = false")
      .andWhere("m.brand_id = :brandId", { brandId })
      .orderBy("m.model_name", "ASC");

    if (status != null) qb.andWhere("m.status = :status", { status });
    if (search)
      qb.andWhere("LOWER(TRIM(m.model_name)) LIKE LOWER(:search)", {
        search: `%${search}%`,
      });

    return qb.getMany();
  }

  async update(
    id: string,
    dto: UpdateModelDto,
    userId: string,
  ): Promise<Model> {
    const entity = await this.repo.findOne({
      where: { id, is_deleted: false },
    });
    if (!entity) throw new NotFoundException(`Model ${id} not found`);

    const name = dto.model_name?.trim() ?? entity.model_name;
    const brand_id = dto.brand_id ?? entity.brand_id;

    if (dto.model_name || dto.brand_id) {
      const existing = await this.repo
        .createQueryBuilder("m")
        .where("LOWER(TRIM(m.model_name)) = LOWER(:name)", { name })
        .andWhere("m.brand_id = :brand_id", { brand_id })
        .andWhere("m.id != :id", { id })
        .andWhere("m.is_deleted = false")
        .getOne();
      if (existing)
        throw new ConflictException(`Model already exists for this brand`);
    }

    Object.assign(entity, dto, { updated_by: userId });
    await this.repo.save(entity);
    await this.redis.delByPattern(`models:*`);

    return this.repo
      .createQueryBuilder("m")
      .select([
        "m.id",
        "m.model_name",
        "m.brand_id",
        "m.status",
        "b.id",
        "b.brand_name",
      ])
      .leftJoin("m.brand", "b")
      .where("m.id = :id", { id })
      .getOne() as Promise<Model>;
  }

  async getAllActiveModels(brandId: string) {
    const cacheKey = `models:all:${brandId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const items = await this.repo.find({
      where: { status: true, is_deleted: false, brand_id: brandId },
      order: { model_name: "ASC" },
      select: ["id", "model_name"],
    });

    await this.redis.set(cacheKey, items, 3600);
    return items;
  }

  async remove(id: string): Promise<void> {
    await this.repo.update(id, { status: false, is_deleted: true });
    await this.redis.delByPattern(`models:*`);
  }
}
