import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SiteSettings } from "../entities/site-settings.entity";
import { UpsertSiteSettingsDto } from "./dto/site-settings.dto";
import { S3Service } from "../s3/s3.service";

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSettings)
    private readonly repo: Repository<SiteSettings>,
    private readonly s3Service: S3Service,
  ) {}

    /** logoUrl / faviconUrl are stored as raw S3 keys — resolve to full public URLs for responses. */
  private withPublicUrls(entity: SiteSettings): SiteSettings {
    return {
      ...entity,
      logoUrl: this.s3Service.getPublicUrl(entity.logoUrl),
      faviconUrl: this.s3Service.getPublicUrl(entity.faviconUrl),
    };
  }

  async upsert(
    dto: UpsertSiteSettingsDto,
    currentUserId?: string,
  ): Promise<SiteSettings> {
    const existing = await this.repo.findOne({ where: { isDeleted: false } });

    if (existing) {
      // UPDATE
      Object.assign(existing, dto);
      existing.updatedBy = currentUserId ?? null;
      // return this.repo.save(existing);
      const saved = await this.repo.save(existing);
      return this.withPublicUrls(saved);
    }

    // CREATE
    const entity = this.repo.create({
      ...dto,
      status: dto.status ?? true,
      isDeleted: false,
      createdBy: currentUserId ?? null,
      updatedBy: currentUserId ?? null,
    });
    // return this.repo.save(entity);
    const saved = await this.repo.save(entity);
    return this.withPublicUrls(saved);
  }

  async findOne(): Promise<SiteSettings> {
    const entity = await this.repo.findOne({ where: { isDeleted: false } });
    if (!entity) throw new NotFoundException("SiteSettings not found");
    // return entity;
    return this.withPublicUrls(entity);
  }

  async remove(currentUserId?: string): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { isDeleted: false } });
    if (!entity) throw new NotFoundException("SiteSettings not found");
    entity.isDeleted = true;
    entity.updatedBy = currentUserId ?? null;
    await this.repo.save(entity);
    return { message: "SiteSettings deleted successfully" };
  }
}
