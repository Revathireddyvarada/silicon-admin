import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Faq } from "../entities/faq.entity";
import { CreateFaqDto, UpdateFaqDto, FaqQueryDto } from "./dto/faq.dto";
import { sqlSortField, sqlSortOrder } from "../common/sql-sort.util";

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(Faq)
    private readonly repo: Repository<Faq>,
  ) {}

  async create(dto: CreateFaqDto): Promise<Faq> {
    const entity = this.repo.create({
      questionName: dto.questionName,
      answer: dto.answer,
      isActive: dto.isActive ?? true,
      userType: dto.userType ?? "customer",
    });
    return this.repo.save(entity);
  }

  async findAll(isActive?: boolean, userType?: string): Promise<Faq[]> {
    const where: { isActive?: boolean; userType?: string } = {};
    if (isActive != null) where.isActive = isActive;
    if (userType) where.userType = userType;
    return this.repo.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async findPaginated(query: FaqQueryDto): Promise<{
    data: Faq[];
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
      ["id", "questionName", "answer", "createdAt", "updatedAt"],
      "createdAt",
    );
    const sortOrder = sqlSortOrder(query.sortOrder);

    const baseWhere: { userType?: string } = {};
    if (query.userType) baseWhere.userType = query.userType;

    const where = query.search
      ? [
          { ...baseWhere, questionName: ILike(`%${query.search}%`) },
          { ...baseWhere, answer: ILike(`%${query.search}%`) },
        ]
      : baseWhere;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Faq> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`FAQ ${id} not found`);
    return entity;
  }

  async update(id: string, dto: UpdateFaqDto): Promise<Faq> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`FAQ ${id} not found`);
    if (dto.questionName !== undefined) entity.questionName = dto.questionName;
    if (dto.answer !== undefined) entity.answer = dto.answer;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    if (dto.userType !== undefined) entity.userType = dto.userType;
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { message: "FAQ deleted successfully" };
  }
}
