import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CustomerTicketHttpService } from "./customer-ticket-http.service";
import { CustomerTicketHttpController } from "./customer-ticket-http.controller";

@Module({
  imports: [ConfigModule],
  controllers: [CustomerTicketHttpController],
  providers: [CustomerTicketHttpService],
  exports: [CustomerTicketHttpService],
})
export class CustomerTicketHttpModule {}