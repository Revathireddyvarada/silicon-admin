import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PricingTier } from "../entities/pricing-tier.entity";
import { PricingTiersService } from "./pricing-tiers.service";
import { PricingTiersController } from "./pricing-tiers.controller";
import { CitiesModule } from "../cities/cities.module";
import { VehicleTypesModule } from "../vehicle-types/vehicle-types.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([PricingTier]),
    CitiesModule,
    VehicleTypesModule,
  ],
  controllers: [PricingTiersController],
  providers: [PricingTiersService],
  exports: [PricingTiersService],
})
export class PricingTiersModule {}
