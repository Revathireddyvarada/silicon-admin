import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SiteSettings } from "../entities/site-settings.entity";
import { SiteSettingsService } from "./site-settings.service";
import { SiteSettingsController } from "./site-settings.controller";
import { S3Module } from "../s3/s3.module";

@Module({
  imports: [TypeOrmModule.forFeature([SiteSettings]), S3Module],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}