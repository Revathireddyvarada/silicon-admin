import { Module } from "@nestjs/common";
import { FleetownersController } from "./fleetowners.controller";
import { FleetownerTransactionsController } from "./fleetowner-transactions.controller";
import { FleettransactionsService } from "./fleettransactions.service";
import { FleetownersService } from "./fleetowners.service";

@Module({
  controllers: [FleetownersController, FleetownerTransactionsController],
  providers: [FleettransactionsService, FleetownersService],
  exports: [FleetownersService],
})
export class FleetownersModule {}
