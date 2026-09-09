import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Cms } from "../entities/cms.entity";
import { CreateCmsDto, UpdateCmsDto, CmsQueryDto } from "./dto/cms.dto";
import { sqlSortField, sqlSortOrder } from "../common/sql-sort.util";

@Injectable()
export class CmsService {
  constructor(
    @InjectRepository(Cms)
    private readonly repo: Repository<Cms>,
  ) {}

  async create(dto: CreateCmsDto): Promise<Cms> {
    const entity = this.repo.create({
      ...dto,
      isActive: dto.isActive ?? true,
      isDelete: false,
    });
    return this.repo.save(entity);
  }

  async findByUrlIndex(urlIndex: string): Promise<Cms> {
    const entity = await this.repo.findOne({
      where: { urlIndex, isDelete: false },
    });
    if (!entity)
      throw new NotFoundException(`CMS page '${urlIndex}' not found`);
    return entity;
  }

  async findAll(isActive?: boolean, urlIndex?: string): Promise<Cms[]> {
    const where: any = { isDelete: false };
    if (isActive != null) where.isActive = isActive;
    if (urlIndex) where.urlIndex = urlIndex;
    return this.repo.find({ where, order: { createdAt: "DESC" } });
  }

  async findPaginated(query: CmsQueryDto): Promise<{
    data: Cms[];
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
      ["title", "urlIndex", "createdAt"],
      "createdAt",
    );
    const sortOrder = sqlSortOrder(query.sortOrder);

    const where = query.search
      ? [
          { title: ILike(`%${query.search}%`), isDelete: false },
          { description: ILike(`%${query.search}%`), isDelete: false },
        ]
      : { isDelete: false };

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

  async findOne(id: string): Promise<Cms> {
    const entity = await this.repo.findOne({ where: { id, isDelete: false } });
    if (!entity) throw new NotFoundException(`CMS ${id} not found`);
    return entity;
  }

  async update(id: string, dto: UpdateCmsDto): Promise<Cms> {
    const entity = await this.repo.findOne({ where: { id, isDelete: false } });
    if (!entity) throw new NotFoundException(`CMS ${id} not found`);
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.urlIndex !== undefined) entity.urlIndex = dto.urlIndex;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.metaKey !== undefined) entity.metaKey = dto.metaKey;
    if (dto.metaDescription !== undefined)
      entity.metaDescription = dto.metaDescription;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { id, isDelete: false } });
    if (!entity) throw new NotFoundException(`CMS ${id} not found`);
    entity.isDelete = true;
    await this.repo.save(entity);
    return { message: "CMS deleted successfully" };
  }
}
