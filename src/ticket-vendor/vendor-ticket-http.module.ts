import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { VendorTicketHttpService } from "./vendor-ticket-http.service";
import { VendorTicketHttpController } from "./vendor-ticket-http.controller";

@Module({
  imports: [ConfigModule],
  controllers: [VendorTicketHttpController],
  providers: [VendorTicketHttpService],
  exports: [VendorTicketHttpService],
})
export class VendorTicketHttpModule {}
