import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HelplineSettings } from "../entities/helpline-settings.entity";
import { HelplineSettingsService } from "./helpline-settings.service";
import { HelplineSettingsController } from "./helpline-settings.controller";

@Module({
  imports: [TypeOrmModule.forFeature([HelplineSettings])],
  controllers: [HelplineSettingsController],
  providers: [HelplineSettingsService],
})
export class HelplineSettingsModule {}