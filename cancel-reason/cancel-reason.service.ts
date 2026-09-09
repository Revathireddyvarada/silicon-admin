import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, ILike, Repository } from "typeorm";
import { CancellationReason } from "../entities/cancellation-reason.entity";
import {
  CreateCancelReasonDto,
  UpdateCancelReasonDto,
  CancelReasonQueryDto,
} from "./dto/cancel-reason.dto";
import { sqlSortField, sqlSortOrder } from "../common/sql-sort.util";

@Injectable()
export class CancelReasonService {
  constructor(
    @InjectRepository(CancellationReason)
    private readonly repo: Repository<CancellationReason>,
    private readonly dataSource: DataSource,
  ) {}

  private async generateDisplayId(): Promise<string> {
    const result = await this.dataSource.query(
      `SELECT CONCAT('#CAN-', LPAD(nextval('cancellation_reasons_display_seq')::text, 3, '0')) AS display_id`,
    );
    return result[0].display_id;
  }

  async create(
    dto: CreateCancelReasonDto,
    currentUserId: string,
  ): Promise<CancellationReason> {
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

  async findAll(isActive?: boolean): Promise<CancellationReason[]> {
    const where: any = { isDeleted: false };
    if (isActive != null) where.isActive = isActive;
    return this.repo.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async findPaginated(query: CancelReasonQueryDto): Promise<{
    data: CancellationReason[];
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

    const baseWhere: any = {
      isDeleted: false,
      ...(query.isActive != null && { isActive: query.isActive }),
    };

    const where = query.search
      ? [{ ...baseWhere, reason: ILike(`%${query.search}%`) }]
      : baseWhere;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<CancellationReason> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!entity) throw new NotFoundException(`Cancel reason ${id} not found`);
    return entity;
  }

  async update(
    id: string,
    dto: UpdateCancelReasonDto,
    currentUserId: string,
  ): Promise<CancellationReason> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!entity) throw new NotFoundException(`Cancel reason ${id} not found`);
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
    if (!entity) throw new NotFoundException(`Cancel reason ${id} not found`);
    entity.isDeleted = true;
    entity.updatedBy = currentUserId ?? null;
    await this.repo.save(entity);
    return { message: "Cancel reason deleted successfully" };
  }
}
