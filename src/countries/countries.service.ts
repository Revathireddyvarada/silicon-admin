import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Country } from "../entities/country.entity";
import { CreateCountryDto } from "./dto/create-country.dto";
import { UpdateCountryDto } from "./dto/update-country.dto";

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country)
    private readonly repo: Repository<Country>,
  ) {}

  async create(dto: CreateCountryDto): Promise<Country> {
    const code = (dto.code ?? "").toString().trim().toUpperCase();
    if (!code) throw new BadRequestException("Country code is required");
    const existingByCode = await this.repo.findOne({ where: { code } });
    if (existingByCode) {
      throw new ConflictException(`Country with code ${dto.code} already exists`);
    }
    const name = (dto.name ?? "").toString().trim();
    if (name) {
      const existingByName = await this.repo
        .createQueryBuilder("c")
        .where("LOWER(TRIM(c.name)) = LOWER(:name)", { name })
        .getOne();
      if (existingByName) {
        throw new ConflictException(`Country with name ${dto.name} already exists`);
      }
    }
    const entity = this.repo.create({
      ...dto,
      code,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(entity);
  }

  async findAll(isActive?: boolean): Promise<Country[]> {
    const where = isActive != null ? { isActive } : {};
    return this.repo.find({ where, order: { name: "ASC" } });
  }

  async findOne(id: string): Promise<Country> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Country ${id} not found`);
    return entity;
  }

  async findByCode(code: string): Promise<Country> {
    const entity = await this.repo.findOne({ where: { code: code.toUpperCase() } });
    if (!entity) throw new NotFoundException(`Country with code ${code} not found`);
    return entity;
  }

  async update(id: string, dto: UpdateCountryDto): Promise<Country> {
    const entity = await this.findOne(id);
    if (dto.code && dto.code.toUpperCase() !== entity.code) {
      const existingByCode = await this.repo.findOne({ where: { code: dto.code.toUpperCase() } });
      if (existingByCode) throw new ConflictException(`Country with code ${dto.code} already exists`);
      entity.code = dto.code.toUpperCase();
    }
    if (dto.name !== undefined) {
      const name = dto.name.toString().trim();
      const existingByName = await this.repo
        .createQueryBuilder("c")
        .where("LOWER(TRIM(c.name)) = LOWER(:name)", { name })
        .andWhere("c.id != :id", { id })
        .getOne();
      if (existingByName) {
        throw new ConflictException(`Country with name ${dto.name} already exists`);
      }
      entity.name = dto.name;
    }
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
  }
}
