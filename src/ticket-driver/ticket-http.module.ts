import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TicketHttpService } from "./ticket-http.service";
import { TicketHttpController } from "./ticket-http.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { User } from "../entities/user.entity";
import { NotificationClientService } from "../send-notification/notification-client.service";
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User]), HttpModule],
  controllers: [TicketHttpController],
  providers: [TicketHttpService, NotificationClientService],
  exports: [TicketHttpService],
})
export class TicketHttpModule {}