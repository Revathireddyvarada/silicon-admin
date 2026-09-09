import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DispatchSettings } from "../entities/dispatch-settings.entity";
import { DispatchSettingsService } from "./dispatch-settings.service";
import { DispatchSettingsController } from "./dispatch-settings.controller";

import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [TypeOrmModule.forFeature([DispatchSettings]), RedisModule],
  controllers: [DispatchSettingsController],
  providers: [DispatchSettingsService],
  exports: [DispatchSettingsService],
})
export class DispatchSettingsModule {}
