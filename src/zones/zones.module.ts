import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ZonesService } from "./zones.service";
import { ZonesController } from "./zones.controller";
import { Zone } from "../entities/zone.entity";
import { State } from "../entities/state.entity";
import { City } from "../entities/city.entity";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [TypeOrmModule.forFeature([Zone, State, City]), RedisModule],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
