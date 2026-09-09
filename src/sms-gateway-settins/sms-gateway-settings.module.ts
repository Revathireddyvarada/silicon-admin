import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SmsGatewaySettings } from "../entities/sms-gateway-settings.entity";
import { SmsGatewaySettingsService } from "./sms-gateway-settings.service";
import { SmsGatewaySettingsController } from "./sms-gateway-settings.controller";

@Module({
  imports: [TypeOrmModule.forFeature([SmsGatewaySettings])],
  controllers: [SmsGatewaySettingsController],
  providers: [SmsGatewaySettingsService],
  exports: [SmsGatewaySettingsService],
})
export class SmsGatewaySettingsModule {}
