import { Injectable, NotFoundException, ConflictException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Colour } from "../entities/colours.entity";
import { CreateColourDto } from "./dto/create-colour.dto";
import { UpdateColourDto } from "./dto/update-colours.dto";
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { RedisService } from "../redis/redis.service";

@Injectable()
export class ColoursService {
  constructor(
    @InjectRepository(Colour)
    private readonly repo: Repository<Colour>,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async create(dto: CreateColourDto, userId: string): Promise<Colour> {
    const name = (dto.colour_name ?? "").toString().trim();
    if (name) {
      const existingByName = await this.repo
        .createQueryBuilder("s")
        .where("LOWER(TRIM(s.colour_name)) = LOWER(:name)", { name })
        .andWhere("s.is_deleted = false")
        .getOne();
      if (existingByName) {
        throw new ConflictException(`Colour already exists`);
      }
    }
    const entity = this.repo.create({
      ...dto,
      created_by: userId,
      updated_by: userId,
      status: dto.status ?? true,
    });
    const saved = await this.repo.save(entity);
    await this.redis.del(`colours:all`);
    return { 
      id: saved.id,
      colour_name: saved.colour_name,
      description: saved.description,
      status: saved.status,
    } as Colour;
  }

  async findAll(query: FindAllQueryDto) {
    const { status, page = 1, limit = 10, search } = query;

    const qb = this.repo.createQueryBuilder("c")
      .select([
        "c.id",
        "c.colour_name",
        "c.status",
        "c.created_at",
        "c.description",
      ])
      .where("c.is_deleted = false")
      .orderBy("c.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (status != null) qb.andWhere("c.status = :status", { status });
    if (search) qb.andWhere("LOWER(TRIM(c.colour_name)) LIKE LOWER(:search)",
      { search: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();
    const result = { items, meta: { total, page, limit } };
    return result;
  }

  async findOne(id: string): Promise<Colour> {
    const entity = await this.repo.createQueryBuilder("c")
      .select([
        "c.id",
        "c.colour_name",
        "c.description",
        "c.status",
        "c.created_at",
      ])
      .where("c.id = :id", { id })
      .andWhere("c.is_deleted = false")
      .getOne();
    if (!entity) throw new NotFoundException(`Colour not found`);

    return entity;
  }

  async update(id: string, dto: UpdateColourDto, userId: string): Promise<Colour> {
    const entity = await this.findOne(id);
    const name = dto.colour_name?.trim() ?? entity.colour_name;
    if (dto.colour_name) {
      const existing = await this.repo.createQueryBuilder("s")
        .select([
          "s.id",
        ])
        .where("LOWER(TRIM(s.colour_name)) = LOWER(:name)", { name })
        .andWhere("s.id != :id", { id })
        .andWhere("s.is_deleted = false")
        .getOne();
      if (existing) throw new ConflictException(`Colour already exists`);
    }
    Object.assign(entity, dto, { updated_by: userId });
    const updated = await this.repo.save(entity);
    
    await this.redis.del(`colours:all`);
    return {
      id: updated.id,
      colour_name: updated.colour_name,
      description: updated.description,
      status: updated.status,
    } as Colour;
  }

  async getAllActiveColours() {
    const cacheKey = `colours:all`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const items = await this.repo.find({
      where: { status: true, is_deleted: false },
      order: { colour_name: "ASC" }, 
      select: ["id", "colour_name"],  
    });

    await this.redis.set(cacheKey, items, 3600);
    return items;
  }

  async remove(id: string): Promise<void> {
    await this.repo.update(id, { status: false, is_deleted: true });
    await this.redis.del(`colours:all`);  
  }
}