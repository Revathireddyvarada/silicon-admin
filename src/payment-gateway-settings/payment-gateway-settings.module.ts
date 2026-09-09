import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentGatewaySettings } from "../entities/payment-gateway-settings.entity";
import { PaymentGatewaySettingsService } from "./payment-gateway-settings.service";
import { PaymentGatewaySettingsController } from "./payment-gateway-settings.controller";

@Module({
  imports: [TypeOrmModule.forFeature([PaymentGatewaySettings])],
  controllers: [PaymentGatewaySettingsController],
  providers: [PaymentGatewaySettingsService],
  exports: [PaymentGatewaySettingsService],
})
export class PaymentGatewaySettingsModule {}