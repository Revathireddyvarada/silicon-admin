import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HelplineSettings } from "../entities/helpline-settings.entity";
import { UpsertHelplineDto } from "./dto/helpline-settings.dto";

@Injectable()
export class HelplineSettingsService {
  constructor(
    @InjectRepository(HelplineSettings)
    private readonly repo: Repository<HelplineSettings>,
  ) {}

  async get(): Promise<HelplineSettings> {
    const existing = await this.repo.findOne({ where: {} });
    if (existing) return existing;

    return this.repo.save(this.repo.create({}));
  }

  async upsert(dto: UpsertHelplineDto): Promise<HelplineSettings> {
    const existing = await this.repo.findOne({ where: {} });

    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }

    return this.repo.save(this.repo.create(dto));
  }
}
