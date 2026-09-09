import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActivityLog } from "../entities/activity-log.entity";
import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";
import { CreateActivityLogDto, ActivityLogQueryDto } from "./dto/activity-log.dto";
import { sqlSortField, sqlSortOrder } from "../common/sql-sort.util";

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
  ) { }

  /**
   * Parses a date string from the UI (supports both "dd/mm/yyyy" and ISO "yyyy-mm-dd" formats).
   * - "start" → sets time to 00:00:00.000 (beginning of day)
   * - "end"   → sets time to 23:59:59.999 (end of day, inclusive)
   */
  private parseDate(dateStr: string, boundary: "start" | "end"): Date {
    let isoStr = dateStr;

    // Convert "dd/mm/yyyy" → "yyyy-mm-dd"
    const ddMmYyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(ddMmYyyy);
    if (match) {
      isoStr = `${match[3]}-${match[2]}-${match[1]}`;
    }

    const date = new Date(isoStr);
    if (boundary === "start") {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  }

  async log(
    dto: CreateActivityLogDto,
    currentUserId?: string,
  ): Promise<ActivityLog> {
    const entity = this.repo.create({
      ...dto,
      recordId: dto.recordId ?? null,
      isDeleted: false,
      createdBy: currentUserId ?? null,
    });
    return this.repo.save(entity);
  }

  async findPaginated(query: ActivityLogQueryDto): Promise<{
    data: ActivityLog[];
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
      ["createdAt", "action", "modelName"],
      "createdAt",
    );
    const sortOrder = sqlSortOrder(query.sortOrder);

    const qb = this.repo
      .createQueryBuilder("log")
      .where("log.isDeleted = :isDeleted", { isDeleted: false })
      .leftJoin(User, "user", "user.id = log.createdBy")
      .leftJoin(Role, "role", "role.id = user.roleId");

    if (query.search) {
      qb.andWhere("log.description ILIKE :search", {
        search: `%${query.search}%`,
      });
    }

    if (query.modelName) {
      qb.andWhere("log.modelName = :modelName", { modelName: query.modelName });
    }

    if (query.createdBy) {
      qb.andWhere("log.createdBy = :createdBy", { createdBy: query.createdBy });
    }

    if (query.userType) {
      qb.andWhere("role.role_name ILIKE :userType", {
        userType: query.userType,
      });
    }

    if (query.fromDate) {
      qb.andWhere("log.createdAt >= :fromDate", {
        fromDate: this.parseDate(query.fromDate, "start"),
      });
    }

    if (query.toDate) {
      qb.andWhere("log.createdAt <= :toDate", {
        toDate: this.parseDate(query.toDate, "end"),
      });
    }

    qb.orderBy(`log.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ActivityLog> {
    const entity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });
    if (!entity) throw new NotFoundException(`Activity log ${id} not found`);
    return entity;
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });
    if (!entity) throw new NotFoundException(`Activity log ${id} not found`);
    entity.isDeleted = true;
    await this.repo.save(entity);
    return { message: "Activity log deleted successfully" };
  }
}