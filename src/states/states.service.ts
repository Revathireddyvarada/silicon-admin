import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { State } from "../entities/state.entity";
import { CreateStateDto } from "./dto/create-state.dto";
import { UpdateStateDto } from "./dto/update-state.dto";
import { FindAllQueryDto } from "./dto/find-all-query.dto";
import { RedisService } from "../redis/redis.service";
import { City } from "../entities/city.entity";
import { Zone } from "../entities/zone.entity";

@Injectable()
export class StatesService {
  constructor(
    @InjectRepository(State)
    private readonly repo: Repository<State>,
    @Inject(RedisService) private readonly redis: RedisService,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
  ) {}

  async create(dto: CreateStateDto, userId: string): Promise<State> {
    const name = (dto.state_name ?? "").toString().trim();
    if (name) {
      const existingByName = await this.repo
        .createQueryBuilder("s")
        .where("LOWER(TRIM(s.state_name)) = LOWER(:name)", { name })
        .andWhere("s.is_deleted = false")
        .getOne();
      if (existingByName) {
        throw new ConflictException(`State already exists`);
      }
    }
    const entity = this.repo.create({
      ...dto,
      created_by: userId,
      updated_by: userId,
      status: dto.status ?? true,
    });
    const saved = await this.repo.save(entity);
    await this.redis.del(`states:all`);
    return {
      id: saved.id,
      state_name: saved.state_name,
      status: saved.status,
      description: saved.description,
    } as State;
  }

  async findAll(query: FindAllQueryDto) {
    const { status, page = 1, limit = 10, search } = query;

    const qb = this.repo
      .createQueryBuilder("s")
      .select([
        "s.id",
        "s.state_name",
        "s.status",
        "s.created_at",
        "s.description",
      ])
      .where("s.is_deleted = false")
      .orderBy("s.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (status != null) qb.andWhere("s.status = :status", { status });
    if (search)
      qb.andWhere("LOWER(TRIM(s.state_name)) LIKE LOWER(:search)", {
        search: `%${search}%`,
      });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string): Promise<State> {
    const entity = await this.repo
      .createQueryBuilder("s")
      .select(["s.id", "s.state_name", "s.status", "s.description"])
      .where("s.id = :id", { id })
      .andWhere("s.is_deleted = false")
      .getOne();
    if (!entity) throw new NotFoundException(`State not found`);
    return entity;
  }

  async update(
    id: string,
    dto: UpdateStateDto,
    userId: string,
  ): Promise<State> {
    const entity = await this.findOne(id);
    const name = dto.state_name?.trim() ?? entity.state_name;
    if (dto.state_name) {
      const existing = await this.repo
        .createQueryBuilder("s")
        .where("LOWER(TRIM(s.state_name)) = LOWER(:name)", { name })
        .andWhere("s.id != :id", { id })
        .andWhere("s.is_deleted = false")
        .getOne();
      if (existing) throw new ConflictException(`State already exists`);
    }
    Object.assign(entity, dto, { updated_by: userId });
    const updated = await this.repo.save(entity);
    await this.redis.del(`states:all`);
    return {
      id: updated.id,
      state_name: updated.state_name,
      status: updated.status,
      description: updated.description,
    } as State;
  }

  async remove(id: string): Promise<void> {
    await this.repo.manager.transaction(async (manager) => {
      const result = await manager.update(
        State,
        { id, is_deleted: false },
        { status: false, is_deleted: true },
      );

      if (!result.affected) {
        throw new NotFoundException("State not found");
      }

      await manager.update(
        City,
        { state_id: id, is_deleted: false },
        { status: false, is_deleted: true },
      );
    });
    await this.redis.del(`states:all`);
  }

  async getAllActiveStates() {
    const cacheKey = `states:all`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const items = await this.repo.find({
      where: { status: true, is_deleted: false },
      order: { state_name: "ASC" },
      select: ["id", "state_name"],
    });

    await this.redis.set(cacheKey, items, 3600);
    return items;
  }

  async getAllActiveStatesWithCities() {
    const [states, cities, zones] = await Promise.all([
      this.repo.find({
        where: { status: true, is_deleted: false },
        order: { state_name: "ASC" },
        select: ["id", "state_name"],
      }),
      this.cityRepo.find({
        where: { status: true, is_deleted: false },
        order: { city_name: "ASC" },
        select: ["id", "city_name", "state_id"],
      }),
      this.zoneRepo.find({
        where: { status: true, is_deleted: false },
        order: { zone_name: "ASC" },
        select: ["id", "zone_name", "city_id", "state_id"],
      }),
    ]);

    const zonesByCity = new Map<string, { id: string; zone_name: string }[]>();
    for (const z of zones) {
      const bucket = zonesByCity.get(z.city_id) ?? [];
      bucket.push({ id: z.id, zone_name: z.zone_name });
      zonesByCity.set(z.city_id, bucket);
    }

    const citiesByState = new Map<
      string,
      {
        id: string;
        city_name: string;
        zones: { id: string; zone_name: string }[];
      }[]
    >();
    for (const c of cities) {
      const bucket = citiesByState.get(c.state_id) ?? [];
      bucket.push({
        id: c.id,
        city_name: c.city_name,
        zones: zonesByCity.get(c.id) ?? [],
      });
      citiesByState.set(c.state_id, bucket);
    }

    const result = states.map((s) => ({
      id: s.id,
      state_name: s.state_name,
      cities: citiesByState.get(s.id) ?? [],
    }));

    return result;
  }
}
