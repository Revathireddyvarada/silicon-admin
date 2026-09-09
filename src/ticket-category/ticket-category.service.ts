import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TicketCategory } from "../entities/ticket-category.entity";
import {
  CreateTicketCategoryDto,
  UpdateTicketCategoryDto,
} from "./dto/ticket-category.dto";

@Injectable()
export class TicketCategoryService {
  constructor(
    @InjectRepository(TicketCategory)
    private readonly repo: Repository<TicketCategory>,
  ) {}

  async create(dto: CreateTicketCategoryDto): Promise<TicketCategory> {
    const existingCategory = await this.repo.findOne({
      where: { name: dto.name, isDeleted: false },
    });
    if (existingCategory) {
      throw new ConflictException(
        `Category with name "${dto.name}" already exists`,
      );
    }

    const entity = this.repo.create({ ...dto, isDeleted: false });
    return this.repo.save(entity);
  }

  async findAll(): Promise<TicketCategory[]> {
    return this.repo.find({
      where: { isDeleted: false },
      order: { name: "ASC" },
    });
  }

  async update(
    id: string,
    dto: UpdateTicketCategoryDto,
  ): Promise<TicketCategory> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!entity) throw new NotFoundException(`Category ${id} not found`);

    if (dto.name && dto.name !== entity.name) {
      const existingCategory = await this.repo
        .createQueryBuilder("category")
        .where("category.name = :name", { name: dto.name })
        .andWhere("category.isDeleted = false")
        .andWhere("category.id != :id", { id })
        .getOne();

      if (existingCategory) {
        throw new ConflictException(
          `Category with name "${dto.name}" already exists`,
        );
      }
    }

    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async findOne(id: string): Promise<TicketCategory> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!entity) throw new NotFoundException(`Category ${id} not found`);
    return entity;
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!entity) throw new NotFoundException(`Category ${id} not found`);
    entity.isDeleted = true;
    await this.repo.save(entity);
    return { message: "Category deleted successfully" };
  }
}
