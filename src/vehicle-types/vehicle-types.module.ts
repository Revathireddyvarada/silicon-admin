import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VehicleType } from "../entities/vehicle-type.entity";
import { VehicleTypesService } from "./vehicle-types.service";
import { VehicleTypesController } from "./vehicle-types.controller";
import { RedisModule } from '../redis/redis.module';   


@Module({
  imports: [TypeOrmModule.forFeature([VehicleType]), RedisModule],
  controllers: [VehicleTypesController],
  providers: [VehicleTypesService],
  exports: [VehicleTypesService],
})
export class VehicleTypesModule { }
