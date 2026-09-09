import { Module } from "@nestjs/common";
import { WebAdminController } from "./web-admin.controller";
import { WebAdminCustomersController } from "./web-admin-customers.controller";
import { WebAdminVendorsController } from "./web-admin-vendors.controller";
import { WebAdminFleetownersController } from "./web-admin-fleetowners.controller";
import { WebAdminTripRatingReasonsController } from "./web-admin-trip-rating-reasons.controller";
import { DriverModule } from "../drivers/drivers.module";
import { TripModule } from "../trips/trip.module";
import { WalletModule } from "../wallet/wallet.module";
import { VendorsModule } from "../vendors/vendors.module";
import { CustomersModule } from "../customers/customers.module";
import { FleetownersModule } from "../fleetowners/fleetowners.module";
import { TicketHttpModule } from "../ticket-driver/ticket-http.module";
import { VendorTicketHttpModule } from "../ticket-vendor/vendor-ticket-http.module";
import { FleetownerTicketHttpModule } from "../fleetowner-ticket/fleetowner-ticket-http.module";
import { TripRatingReasonsModule } from "../trip-rating-reasons/trip-rating-reasons.module";

@Module({
  imports: [
    DriverModule,
    TripModule,
    WalletModule,
    VendorsModule,
    CustomersModule,
    FleetownersModule,
    TicketHttpModule,
    VendorTicketHttpModule,
    FleetownerTicketHttpModule,
    TripRatingReasonsModule,
  ],
  controllers: [
    WebAdminController,
    WebAdminCustomersController,
    WebAdminVendorsController,
    WebAdminFleetownersController,
    WebAdminTripRatingReasonsController,
  ],
})
export class WebAdminModule {}
