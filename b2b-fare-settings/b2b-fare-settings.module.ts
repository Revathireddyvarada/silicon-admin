import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { B2bFareSettings } from "../entities/b2b-fare-settings.entity";
import { B2bFareSettingsService } from "./b2b-fare-settings.service";
import { B2bFareSettingsController } from "./b2b-fare-settings.controller";

@Module({
  imports: [TypeOrmModule.forFeature([B2bFareSettings])],
  controllers: [B2bFareSettingsController],
  providers: [B2bFareSettingsService],
  exports: [B2bFareSettingsService],
})
export class B2bFareSettingsModule {}