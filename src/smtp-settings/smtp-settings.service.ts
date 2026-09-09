import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SmtpSettings } from "../entities/smtp-settings.entity";
import { UpsertSmtpSettingsDto } from "./dto/smtp-settings.dto";

@Injectable()
export class SmtpSettingsService {
  constructor(
    @InjectRepository(SmtpSettings)
    private readonly repo: Repository<SmtpSettings>,
  ) {}

  async upsert(dto: UpsertSmtpSettingsDto): Promise<SmtpSettings> {
    const existing = await this.repo.findOne({ where: { isDeleted: false } });

    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }

    const entity = this.repo.create({
      ...dto,
      isActive: dto.isActive ?? true,
      isDeleted: false,
    });
    return this.repo.save(entity);
  }

  async findOne(): Promise<SmtpSettings> {
    const entity = await this.repo.findOne({ where: { isDeleted: false } });
    if (!entity) throw new NotFoundException("SMTP settings not found");
    return entity;
  }

  async remove(): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { isDeleted: false } });
    if (!entity) throw new NotFoundException("SMTP settings not found");
    entity.isDeleted = true;
    await this.repo.save(entity);
    return { message: "SMTP settings deleted successfully" };
  }
}
