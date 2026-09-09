import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../entities/city.entity';
import { State } from '../entities/state.entity';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly repo     : Repository<City>,
    @InjectRepository(State)
    private readonly stateRepo: Repository<State>,
    private readonly redis    : RedisService,
  ) {}

  // ── Create ─────────────────────────────────────────────

  async create(dto: CreateCityDto, userId: string): Promise<City> {
    const state = await this.stateRepo.findOne({
      where: { id: dto.state_id, is_deleted: false, status: true },
    });
    if (!state) throw new NotFoundException('State not found');

    const name = dto.city_name.trim();
    const existing = await this.repo
      .createQueryBuilder('c')
      .where('LOWER(TRIM(c.city_name)) = LOWER(:name)', { name })
      .andWhere('c.state_id = :stateId',  { stateId: dto.state_id })
      .andWhere('c.is_deleted = false')
      .getOne();

    if (existing)
      throw new ConflictException(`City ${name} already exists in this state`);

    const entity = this.repo.create({
      ...dto,
      status    : dto.status ?? true,
      created_by: userId,
      updated_by: userId,
    });

    const saved = await this.repo.save(entity);
    await this.invalidateCache(dto.state_id);   // ← invalidate specific state cache

    return {
      id       : saved.id,
      city_name: saved.city_name,
      state_id : saved.state_id,
      status   : saved.status,
    } as City;
  }

  // ── Find all — paginated ───────────────────────────────

  async findAll(query: FindAllQueryDto) {
    const { status, page = 1, limit = 10, search } = query;

    const qb = this.repo
      .createQueryBuilder('c')
      .select(['c.id', 'c.city_name', 'c.status', 'c.created_at', 's.id', 's.state_name'])
      .leftJoin('c.state', 's')
      .where('c.is_deleted = false')
      .orderBy('c.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status != null) qb.andWhere('c.status = :status', { status });
    if (search)
      qb.andWhere('LOWER(TRIM(c.city_name)) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit } };
  }

  // ── Find one ───────────────────────────────────────────

  async findOne(id: string): Promise<City> {
    const entity = await this.repo
      .createQueryBuilder('c')
      .select(['c.id', 'c.city_name', 'c.state_id', 'c.status', 's.id', 's.state_name'])
      .leftJoin('c.state', 's')
      .where('c.id = :id',           { id })
      .andWhere('c.is_deleted = false')
      .getOne();

    if (!entity) throw new NotFoundException('City not found');
    return entity;
  }

  // ── Update ─────────────────────────────────────────────

  async update(id: string, dto: UpdateCityDto, userId: string): Promise<City> {
    const entity = await this.repo.findOne({ where: { id, is_deleted: false } });
    if (!entity) throw new NotFoundException(`City not found`);

    const oldStateId = entity.state_id;
    const name     = dto.city_name?.trim() ?? entity.city_name;
    const state_id = dto.state_id          ?? entity.state_id;

    if (dto.city_name || dto.state_id) {
      const existing = await this.repo
        .createQueryBuilder('c')
        .where('LOWER(TRIM(c.city_name)) = LOWER(:name)', { name })
        .andWhere('c.state_id = :state_id',  { state_id })
        .andWhere('c.id != :id',             { id })
        .andWhere('c.is_deleted = false')
        .getOne();

      if (existing)
        throw new ConflictException('City already exists for this state');
    }

    Object.assign(entity, dto, { updated_by: userId });
    await this.repo.save(entity);
    await this.invalidateCache(state_id);
    if (oldStateId !== state_id) {
      await this.invalidateCache(oldStateId);   // ← also clear old state's cache
    }

    return this.repo
      .createQueryBuilder('c')
      .select(['c.id', 'c.city_name', 'c.state_id', 'c.status', 's.id', 's.state_name'])
      .leftJoin('c.state', 's')
      .where('c.id = :id', { id })
      .getOne() as Promise<City>;
  }

  // ── Remove ─────────────────────────────────────────────

  async remove(id: string): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    await this.repo.update(id, { status: false, is_deleted: true });
    if (entity?.state_id) {
      await this.invalidateCache(entity.state_id); // ← invalidate specific state cache
    }
  }

  // ── Get all active — cached per state ─────────────────

  async getAllActiveCities(stateId: string) {
    const stateFilter = String(stateId || "").trim();
    const cacheKey = stateFilter ? `cities:all:${stateFilter}` : "cities:all";

    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const items = await this.repo.find({
      where: stateFilter
        ? { status: true, is_deleted: false, state_id: stateFilter }
        : { status: true, is_deleted: false },
      order: { city_name: "ASC" },
      select: ["id", "city_name"],
    });

    await this.redis.set(cacheKey, items, 3600); // ← TTL 1 hour ✅
    return items;
  }

  // ── Private — invalidate cache for state ──────────────

  private async invalidateCache(stateId: string): Promise<void> {
    await this.redis.del(`cities:all:${stateId}`); // ← del specific key
  }
}