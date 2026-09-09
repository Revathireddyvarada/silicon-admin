import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SmsGatewaySettings } from "../entities/sms-gateway-settings.entity";
import { UpsertSmsGatewaySettingsDto } from "./dto/sms-gateway-settings.dto";

@Injectable()
export class SmsGatewaySettingsService {
  constructor(
    @InjectRepository(SmsGatewaySettings)
    private readonly repo: Repository<SmsGatewaySettings>,
  ) {}

  async upsert(dto: UpsertSmsGatewaySettingsDto): Promise<SmsGatewaySettings> {
    const existing = await this.repo.findOne({ where: { isDeleted: false } });

    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }

    const entity = this.repo.create({
      ...dto,
      isDeleted: false,
    });
    return this.repo.save(entity);
  }

  async findOne(): Promise<SmsGatewaySettings> {
    const entity = await this.repo.findOne({ where: { isDeleted: false } });
    if (!entity) throw new NotFoundException("SMS gateway settings not found");
    return entity;
  }

  async remove(): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { isDeleted: false } });
    if (!entity) throw new NotFoundException("SMS gateway settings not found");
    entity.isDeleted = true;
    await this.repo.save(entity);
    return { message: "SMS gateway settings deleted successfully" };
  }
}
