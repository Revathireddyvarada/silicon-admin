import { Module } from "@nestjs/common";
import { WebVendorMastersController } from "./web-vendor-masters.controller";
import { MobileVendorMastersController } from "./mobile-vendor-masters.controller";
import { StatesModule } from "../states/states.module";
import { CitiesModule } from "../cities/cities.module";
import { BrandsModule } from "../brands/brands.module";
import { VehicleTypesModule } from "../vehicle-types/vehicle-types.module";
import { TripRatingReasonsModule } from "../trip-rating-reasons/trip-rating-reasons.module";
import { B2bFareSettingsModule } from "../b2b-fare-settings/b2b-fare-settings.module";
import { S3Module } from "../s3/s3.module";

@Module({
  imports: [
    StatesModule,
    CitiesModule,
    BrandsModule,
    VehicleTypesModule,
    TripRatingReasonsModule,
    B2bFareSettingsModule,
    S3Module,
  ],
  controllers: [WebVendorMastersController, MobileVendorMastersController],
})
export class WebVendorModule {}
