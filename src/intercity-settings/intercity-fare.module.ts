import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InterCityFareSettings } from "../entities/intercity-fare-settings.entity";
import { InterCityTripSettings } from "../entities/intercity-trip-settings.entity";
import { InterCityFareService } from "./intercity-fare.service";
import { InterCityFareController } from "./intercity-fare.controller";

@Module({
  imports: [TypeOrmModule.forFeature([InterCityFareSettings, InterCityTripSettings])],
  controllers: [InterCityFareController],
  providers: [InterCityFareService],
  exports: [InterCityFareService],
})
export class InterCityFareModule {}