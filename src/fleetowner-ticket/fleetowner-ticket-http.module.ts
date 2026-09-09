import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FleetownerTicketHttpService } from "./fleetowner-ticket-http.service";
import { FleetownerTicketHttpController } from "./fleetowner-ticket-http.controller";
import { InAppNotificationModule } from "../notification/notification.module";


@Module({
  imports: [ConfigModule, InAppNotificationModule],
  controllers: [FleetownerTicketHttpController],
  providers: [FleetownerTicketHttpService],
  exports: [FleetownerTicketHttpService],
})
export class FleetownerTicketHttpModule {}