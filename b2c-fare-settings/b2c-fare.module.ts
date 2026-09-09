import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { B2cKmFareSettings } from "../entities/b2c-km-fare-settings.entity";
import { B2cTripSettings } from "../entities/b2c-trip-settings.entity";
import { B2cFareService } from "./b2c-fare.service";
import { B2cFareController } from "./b2c-fare.controller";

@Module({
  imports: [TypeOrmModule.forFeature([B2cKmFareSettings, B2cTripSettings])],
  controllers: [B2cFareController],
  providers: [B2cFareService],
  exports: [B2cFareService],
})
export class B2cFareModule {}
