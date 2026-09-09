import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { State } from "../entities/state.entity";
import { City } from "../entities/city.entity";
import { Zone } from "../entities/zone.entity";
import { StatesService } from "./states.service";
import { StatesController } from "./states.controller";
import { CountriesModule } from "../countries/countries.module";

@Module({
  imports: [TypeOrmModule.forFeature([State, City, Zone]), CountriesModule],
  controllers: [StatesController],
  providers: [StatesService],
  exports: [StatesService],
})
export class StatesModule {}
