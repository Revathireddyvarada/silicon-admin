import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SmtpSettings } from "../entities/smtp-settings.entity";
import { SmtpSettingsService } from "./smtp-settings.service";
import { SmtpSettingsController } from "./smtp-settings.controller";

@Module({
  imports: [TypeOrmModule.forFeature([SmtpSettings])],
  controllers: [SmtpSettingsController],
  providers: [SmtpSettingsService],
  exports: [SmtpSettingsService],
})
export class SmtpSettingsModule {}
