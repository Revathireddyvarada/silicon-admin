import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaymentGatewaySettings } from "../entities/payment-gateway-settings.entity";
import { UpsertPaymentGatewaySettingsDto } from "./dto/payment-gateway-settings-dto";

@Injectable()
export class PaymentGatewaySettingsService {
  constructor(
    @InjectRepository(PaymentGatewaySettings)
    private readonly repo: Repository<PaymentGatewaySettings>,
  ) {}

  async upsert(
    dto: UpsertPaymentGatewaySettingsDto,
  ): Promise<PaymentGatewaySettings> {
    const existing = await this.repo.findOne({ where: { isDeleted: false } });

    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }

    const entity = this.repo.create({
      ...dto,
      provider: dto.provider ?? "razorpay",
      isDeleted: false,
    });
    return this.repo.save(entity);
  }

  async findOne(): Promise<PaymentGatewaySettings> {
    const entity = await this.repo.findOne({ where: { isDeleted: false } });
    if (!entity)
      throw new NotFoundException("Payment gateway settings not found");
    return entity;
  }

  async remove(): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { isDeleted: false } });
    if (!entity)
      throw new NotFoundException("Payment gateway settings not found");
    entity.isDeleted = true;
    await this.repo.save(entity);
    return { message: "Payment gateway settings deleted successfully" };
  }
}
