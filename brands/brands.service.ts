import { Injectable, NotFoundException, ConflictException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Brand } from "../entities/brand.entity";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { FindAllQueryDto } from "./dto/find-all-query.dto";
import { RedisService } from "../redis/redis.service";
import { Model } from "../entities/model.entity";

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly repo: Repository<Brand>,
    @Inject(RedisService) private readonly redis: RedisService,
  ) { }

  async create(dto: CreateBrandDto, userId: string): Promise<Brand> {
    const name = (dto.brand_name ?? "").toString().trim();
    if (name) {
      const existingByName = await this.repo
        .createQueryBuilder("b")
        .where("LOWER(TRIM(b.brand_name)) = LOWER(:name)", { name })
        .andWhere("b.is_deleted = false")
        .getOne();
      if (existingByName) {
        throw new ConflictException(`Brand with name ${dto.brand_name} already exists`);
      }
    }
    const entity = this.repo.create({
      ...dto,
      created_by: userId,
      updated_by: userId,
      status: dto.status ?? true,
    });
    const saved = await this.repo.save(entity);
    await this.redis.del(`brands:all`);
    return {
      id: saved.id,
      brand_name: saved.brand_name,
      description: saved.description,
      status: saved.status,
    } as Brand;
  }

  async findAll(query: FindAllQueryDto) {
    const { status, page = 1, limit = 10, search } = query;

    const qb = this.repo.createQueryBuilder("s")
      .select([
        "s.id",
        "s.brand_name",
        "s.description",
        "s.status",
        "s.created_at",
      ])
      .where("s.is_deleted = false")
      .orderBy("s.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (status != null) qb.andWhere("s.status = :status", { status });
    if (search) qb.andWhere("LOWER(TRIM(s.brand_name)) LIKE LOWER(:search)",
      { search: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string): Promise<Brand> {
    const entity = await this.repo.createQueryBuilder("c")
      .select([
        "c.id",
        "c.brand_name",
        "c.description",
        "c.status",
        "c.created_at",
      ])
      .where("c.id = :id", { id })
      .andWhere("c.is_deleted = false")
      .getOne();
    if (!entity) throw new NotFoundException(`Brand ${id} not found`);
    return entity;
  }

  async update(id: string, dto: UpdateBrandDto, userId: string): Promise<Brand> {
    const entity = await this.findOne(id);
    const name = dto.brand_name?.trim() ?? entity.brand_name;
    if (dto.brand_name) {
      const existing = await this.repo
        .createQueryBuilder("b")
        .where("LOWER(TRIM(b.brand_name)) = LOWER(:name)", { name })
        .andWhere("b.id != :id", { id })
        .andWhere("b.is_deleted = false")
        .getOne();
      if (existing) throw new ConflictException(`Brand already exists`);
    }
    Object.assign(entity, dto, { updated_by: userId });
    const updated = await this.repo.save(entity);

    await this.redis.del(`brands:all`);
    return {
      id: updated.id,
      brand_name: updated.brand_name,
      description: updated.description,
      status: updated.status,
    } as Brand;
  }

  async getAllActiveBrands() {
    const cacheKey = `brands:all`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const items = await this.repo.find({
      where: { status: true, is_deleted: false },
      order: { brand_name: "ASC" },
      select: ["id", "brand_name"],
    });

    await this.redis.set(cacheKey, items, 3600);
    return items;
  }

  async remove(id: string): Promise<void> {
    await this.repo.manager.transaction(async (manager) => {
      const result = await manager.update(Brand, { id, is_deleted: false }, { status: false, is_deleted: true });

      if (!result.affected) {
        throw new NotFoundException("Brand not found");
      }

      await manager.update(Model, { brand_id: id, is_deleted: false }, { status: false, is_deleted: true });
    });

    await this.redis.del(`brands:all`);
    await this.redis.delByPattern(`models:*`);
  }
}