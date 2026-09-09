import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CitiesService } from "./cities.service";
import { CitiesController } from "./cities.controller";
import { City } from "../entities/city.entity";
import { State } from "../entities/state.entity";
import { RedisModule } from '../redis/redis.module';   

@Module({
  imports: [TypeOrmModule.forFeature([City, State]), RedisModule],
  controllers: [CitiesController],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule { }
