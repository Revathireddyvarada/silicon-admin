import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { HelpCenter } from "../entities/help-center.entity";
import {
  CreateHelpCenterDto,
  UpdateHelpCenterDto,
  HelpCenterQueryDto,
} from "./dto/help-center.dto";
import { sqlSortField, sqlSortOrder } from "../common/sql-sort.util";

@Injectable()
export class HelpCenterService {
  constructor(
    @InjectRepository(HelpCenter)
    private readonly repo: Repository<HelpCenter>,
  ) {}

  async create(dto: CreateHelpCenterDto): Promise<HelpCenter> {
    const entity = this.repo.create({
      questionName: dto.questionName,
      description: dto.description,
      videoUrl: dto.videoUrl ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(entity);
  }

  async findAll(isActive?: boolean): Promise<HelpCenter[]> {
    const where: { isActive?: boolean } = {};
    if (isActive != null) where.isActive = isActive;
    return this.repo.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async findPaginated(query: HelpCenterQueryDto): Promise<{
    data: HelpCenter[];
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
      ["id", "questionName", "description", "createdAt", "updatedAt"],
      "createdAt",
    );
    const sortOrder = sqlSortOrder(query.sortOrder);

    const where = query.search
      ? [
          { questionName: ILike(`%${query.search}%`) },
          { description: ILike(`%${query.search}%`) },
        ]
      : {};

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<HelpCenter> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`HelpCenter ${id} not found`);
    return entity;
  }

  async update(id: string, dto: UpdateHelpCenterDto): Promise<HelpCenter> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`HelpCenter ${id} not found`);
    if (dto.questionName !== undefined) entity.questionName = dto.questionName;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.videoUrl !== undefined) entity.videoUrl = dto.videoUrl ?? null;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { message: "HelpCenter entry deleted successfully" };
  }
}
