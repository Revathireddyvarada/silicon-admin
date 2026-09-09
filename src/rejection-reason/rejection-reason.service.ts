import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, ILike, Repository } from "typeorm";
import { RejectionReason } from "../entities/rejection-reason.entity";
import {
  CreateRejectionReasonDto,
  UpdateRejectionReasonDto,
  RejectionReasonQueryDto,
} from "./dto/rejection-reason.dto";
import { sqlSortField, sqlSortOrder } from "../common/sql-sort.util";

@Injectable()
export class RejectionReasonService {
  constructor(
    @InjectRepository(RejectionReason)
    private readonly repo: Repository<RejectionReason>,
    private readonly dataSource: DataSource,
  ) {}

  private async generateDisplayId(): Promise<string> {
    const result = await this.dataSource.query(
      `SELECT CONCAT('#REJ-', LPAD(nextval('rejection_reasons_display_seq')::text, 6, '0')) AS display_id`,
    );
    return result[0].display_id;
  }

  async create(
    dto: CreateRejectionReasonDto,
    currentUserId: string,
  ): Promise<RejectionReason> {
    const entity = this.repo.create({
      displayId: await this.generateDisplayId(),
      reason: dto.reason,
      isActive: dto.isActive ?? true,
      isDeleted: false,
      createdBy: currentUserId ?? null,
      updatedBy: currentUserId ?? null,
    });
    return this.repo.save(entity);
  }

  async findAll(isActive?: boolean): Promise<RejectionReason[]> {
    const where: any = { isDeleted: false };
    if (isActive != null) where.isActive = isActive;
    return this.repo.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async findPaginated(query: RejectionReasonQueryDto): Promise<{
    data: RejectionReason[];
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
      ["id", "reason", "isActive", "createdAt", "updatedAt"],
      "createdAt",
    );
    const sortOrder = sqlSortOrder(query.sortOrder);

    const where: any = query.search
      ? [
          {
            reason: ILike(`%${query.search}%`),
            isDeleted: false,
            ...(query.isActive != null && { isActive: query.isActive }),
          },
        ]
      : {
          isDeleted: false,
          ...(query.isActive != null && { isActive: query.isActive }),
        };

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<RejectionReason> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!entity)
      throw new NotFoundException(`Rejection reason ${id} not found`);
    return entity;
  }

  async update(
    id: string,
    dto: UpdateRejectionReasonDto,
    currentUserId: string,
  ): Promise<RejectionReason> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!entity)
      throw new NotFoundException(`Rejection reason ${id} not found`);
    if (dto.reason !== undefined) entity.reason = dto.reason;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    entity.updatedBy = currentUserId ?? null;

    return this.repo.save(entity);
  }

  async remove(
    id: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!entity)
      throw new NotFoundException(`Rejection reason ${id} not found`);
    entity.isDeleted = true;
    entity.updatedBy = currentUserId ?? null;
    await this.repo.save(entity);
    return { message: "Rejection reason deleted successfully" };
  }
}
