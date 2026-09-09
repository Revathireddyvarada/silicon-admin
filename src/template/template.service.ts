import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Template } from "../entities/template.entity";
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQueryDto,
} from "./dto/template.dto";
import { DeliveryMethod } from "../entities/template.entity";
import { FindOptionsWhere } from "typeorm";
import { sqlSortField, sqlSortOrder } from "../common/sql-sort.util";
@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private readonly repo: Repository<Template>,
  ) {}

  async create(
    dto: CreateTemplateDto,
    currentUserId?: string,
  ): Promise<Template> {
    const entity = this.repo.create({
      ...dto,
      isActive: dto.isActive ?? true,
      isDelete: false,
      createdBy: currentUserId ?? null,
      updatedBy: currentUserId ?? null,
    });
    return this.repo.save(entity);
  }

  async findAll(
    isActive?: boolean,
    deliveryMethod?: string,
  ): Promise<Template[]> {
    const where: FindOptionsWhere<Template> = {
      isDelete: false,
    };
    if (isActive != null) where.isActive = isActive;
    if (deliveryMethod) where.deliveryMethod = deliveryMethod as DeliveryMethod;

    return this.repo.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async findPaginated(query: TemplateQueryDto): Promise<{
    data: Template[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortBy = sqlSortField(
      query.sortBy,
      ["templateName", "deliveryMethod", "createdAt", "updatedAt"],
      "createdAt",
    );
    const sortOrder = sqlSortOrder(query.sortOrder);

    const where = query.search
      ? [
          { templateName: ILike(`%${query.search}%`), isDelete: false },
          { subject: ILike(`%${query.search}%`), isDelete: false },
        ]
      : { isDelete: false };

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Template> {
    const entity = await this.repo.findOne({ where: { id, isDelete: false } });
    if (!entity) throw new NotFoundException(`Template ${id} not found`);
    return entity;
  }

  async update(
    id: string,
    dto: UpdateTemplateDto,
    currentUserId?: string,
  ): Promise<Template> {
    const entity = await this.repo.findOne({ where: { id, isDelete: false } });
    if (!entity) throw new NotFoundException(`Template ${id} not found`);
    if (dto.deliveryMethod !== undefined)
      entity.deliveryMethod = dto.deliveryMethod;
    if (dto.templateName !== undefined) entity.templateName = dto.templateName;
    if (dto.subject !== undefined) entity.subject = dto.subject;
    if (dto.message !== undefined) entity.message = dto.message;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    entity.updatedBy = currentUserId ?? null;
    return this.repo.save(entity);
  }

  async remove(
    id: string,
    currentUserId?: string,
  ): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { id, isDelete: false } });
    if (!entity) throw new NotFoundException(`Template ${id} not found`);
    entity.isDelete = true;
    entity.updatedBy = currentUserId ?? null;
    await this.repo.save(entity);
    return { message: "Template deleted successfully" };
  }
}
