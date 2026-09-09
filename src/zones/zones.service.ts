import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Zone,
  ZoneLatLng,
  ZonePolygonGeoJson,
} from "../entities/zone.entity";
import { State } from "../entities/state.entity";
import { City } from "../entities/city.entity";
import { CreateZoneDto } from "./dto/create-zone.dto";
import { UpdateZoneDto } from "./dto/update-zone.dto";
import { FindAllZonesQueryDto } from "./dto/find-all-zones-query.dto";
import { RedisService } from "../redis/redis.service";
import {
  CachedZone,
  ZONES_ACTIVE_CACHE_KEY,
} from "./zones-cache.constants";

@Injectable()
export class ZonesService implements OnModuleInit {
  private readonly logger = new Logger(ZonesService.name);

  constructor(
    @InjectRepository(Zone)
    private readonly repo: Repository<Zone>,
    @InjectRepository(State)
    private readonly stateRepo: Repository<State>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.refreshActiveZonesCache();
    } catch (err) {
      this.logger.warn(
        `Zone Redis warm failed: ${(err as Error).message}`,
      );
    }
  }

  private toGeoJson(paths: ZoneLatLng[]): ZonePolygonGeoJson {
    if (!paths?.length || paths.length < 3) {
      throw new BadRequestException("Polygon must have at least 3 points");
    }
    for (const p of paths) {
      if (
        !Number.isFinite(p.lat) ||
        !Number.isFinite(p.lng) ||
        p.lat < -90 ||
        p.lat > 90 ||
        p.lng < -180 ||
        p.lng > 180
      ) {
        throw new BadRequestException("Invalid lat/lng in polygon_paths");
      }
    }
    const ring = paths.map((p) => [p.lng, p.lat] as number[]);
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]]);
    }
    return { type: "Polygon", coordinates: [ring] };
  }

  private toBbox(paths: ZoneLatLng[]): CachedZone["bbox"] {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    for (const p of paths) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }
    return { minLat, maxLat, minLng, maxLng };
  }

  /** Rebuild Redis cache used by ride-service on trip create. */
  async refreshActiveZonesCache(): Promise<number> {
    const rows = await this.repo.find({
      where: { status: true, is_deleted: false },
      select: [
        "id",
        "zone_name",
        "state_id",
        "city_id",
        "polygon_paths",
      ],
    });

    const payload: CachedZone[] = rows
      .filter((z) => Array.isArray(z.polygon_paths) && z.polygon_paths.length >= 3)
      .map((z) => ({
        id: z.id,
        zone_name: z.zone_name,
        state_id: z.state_id,
        city_id: z.city_id,
        polygon_paths: z.polygon_paths,
        bbox: this.toBbox(z.polygon_paths),
      }));

    // ttl 0 = no expiry; refreshed on every zone CRUD + boot
    await this.redis.set(ZONES_ACTIVE_CACHE_KEY, payload, 0);
    this.logger.log(`Cached ${payload.length} active zone(s) → ${ZONES_ACTIVE_CACHE_KEY}`);
    return payload.length;
  }

  private async assertStateAndCity(stateId: string, cityId: string) {
    const state = await this.stateRepo.findOne({
      where: { id: stateId, is_deleted: false, status: true },
    });
    if (!state) throw new NotFoundException("State not found");

    const city = await this.cityRepo.findOne({
      where: { id: cityId, is_deleted: false, status: true },
    });
    if (!city) throw new NotFoundException("City not found");
    if (city.state_id !== stateId) {
      throw new BadRequestException("City does not belong to the selected state");
    }
  }

  async create(dto: CreateZoneDto, userId: string): Promise<Zone> {
    await this.assertStateAndCity(dto.state_id, dto.city_id);

    const name = dto.zone_name.trim();
    const existing = await this.repo
      .createQueryBuilder("z")
      .where("LOWER(TRIM(z.zone_name)) = LOWER(:name)", { name })
      .andWhere("z.city_id = :cityId", { cityId: dto.city_id })
      .andWhere("z.is_deleted = false")
      .getOne();
    if (existing) {
      throw new ConflictException(`Zone ${name} already exists in this city`);
    }

    const paths = dto.polygon_paths.map((p) => ({
      lat: Number(p.lat),
      lng: Number(p.lng),
    }));
    const polygon = this.toGeoJson(paths);

    const entity = this.repo.create({
      zone_name: name,
      state_id: dto.state_id,
      city_id: dto.city_id,
      polygon,
      polygon_paths: paths,
      status: dto.status ?? true,
      created_by: userId,
      updated_by: userId,
    });

    const saved = await this.repo.save(entity);
    await this.refreshActiveZonesCache();
    return this.findOne(saved.id);
  }

  async findAll(query: FindAllZonesQueryDto) {
    const { status, page = 1, limit = 10, search, state_id, city_id } = query;

    const qb = this.repo
      .createQueryBuilder("z")
      .select([
        "z.id",
        "z.zone_name",
        "z.state_id",
        "z.city_id",
        "z.status",
        "z.created_at",
        "z.polygon_paths",
        "s.id",
        "s.state_name",
        "c.id",
        "c.city_name",
      ])
      .leftJoin("z.state", "s")
      .leftJoin("z.city", "c")
      .where("z.is_deleted = false")
      .orderBy("z.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (status != null) qb.andWhere("z.status = :status", { status });
    if (state_id) qb.andWhere("z.state_id = :state_id", { state_id });
    if (city_id) qb.andWhere("z.city_id = :city_id", { city_id });
    if (search) {
      qb.andWhere("LOWER(TRIM(z.zone_name)) LIKE LOWER(:search)", {
        search: `%${search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string): Promise<Zone> {
    const entity = await this.repo
      .createQueryBuilder("z")
      .select([
        "z.id",
        "z.zone_name",
        "z.state_id",
        "z.city_id",
        "z.polygon",
        "z.polygon_paths",
        "z.status",
        "z.created_at",
        "z.updated_at",
        "s.id",
        "s.state_name",
        "c.id",
        "c.city_name",
      ])
      .leftJoin("z.state", "s")
      .leftJoin("z.city", "c")
      .where("z.id = :id", { id })
      .andWhere("z.is_deleted = false")
      .getOne();

    if (!entity) throw new NotFoundException("Zone not found");
    return entity;
  }

  async update(id: string, dto: UpdateZoneDto, userId: string): Promise<Zone> {
    const entity = await this.repo.findOne({ where: { id, is_deleted: false } });
    if (!entity) throw new NotFoundException("Zone not found");

    const state_id = dto.state_id ?? entity.state_id;
    const city_id = dto.city_id ?? entity.city_id;
    if (dto.state_id || dto.city_id) {
      await this.assertStateAndCity(state_id, city_id);
    }

    const name = dto.zone_name?.trim() ?? entity.zone_name;
    if (dto.zone_name || dto.city_id) {
      const existing = await this.repo
        .createQueryBuilder("z")
        .where("LOWER(TRIM(z.zone_name)) = LOWER(:name)", { name })
        .andWhere("z.city_id = :city_id", { city_id })
        .andWhere("z.id != :id", { id })
        .andWhere("z.is_deleted = false")
        .getOne();
      if (existing) {
        throw new ConflictException(`Zone ${name} already exists in this city`);
      }
    }

    entity.zone_name = name;
    entity.state_id = state_id;
    entity.city_id = city_id;
    if (dto.status != null) entity.status = dto.status;
    if (dto.polygon_paths?.length) {
      const paths = dto.polygon_paths.map((p) => ({
        lat: Number(p.lat),
        lng: Number(p.lng),
      }));
      entity.polygon_paths = paths;
      entity.polygon = this.toGeoJson(paths);
    }
    entity.updated_by = userId;

    await this.repo.save(entity);
    await this.refreshActiveZonesCache();
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { id, is_deleted: false } });
    if (!entity) throw new NotFoundException("Zone not found");
    entity.is_deleted = true;
    entity.status = false;
    await this.repo.save(entity);
    await this.refreshActiveZonesCache();
    return { message: "Zone deleted" };
  }
}
