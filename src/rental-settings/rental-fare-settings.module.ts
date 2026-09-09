import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RentalPackage } from "../entities/rental-package.entity";
import { RentalFareSettings } from "../entities/rental-fare-settings.entity";
import { RentalTripSettings } from "../entities/rental-trip-settings.entity";
import { RentalFareService } from "./rental-fare-settings.service";
import { RentalFareController } from "./rental-fare-settings.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RentalPackage,
      RentalFareSettings,
      RentalTripSettings,
    ]),
  ],
  controllers: [RentalFareController],
  providers: [RentalFareService],
  exports: [RentalFareService],
})
export class RentalFareModule {}
