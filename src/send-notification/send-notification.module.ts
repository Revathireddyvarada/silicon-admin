import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { Notification } from "../entities/send-notification.entity";
import { NotificationRecipient } from "../entities/notification-recipient.entity";
import { Template } from "../entities/template.entity";
import { User } from "../entities/user.entity";
import { NotificationService } from "./send-notification.service";
import { NotificationController } from "./send-notification.controller";
import { UserFetchService } from "./user-fetch.service";
import { NotificationClientService } from "./notification-client.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationRecipient,
      Template,
      User,
    ]),
    HttpModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, UserFetchService, NotificationClientService],
  exports: [NotificationService, NotificationClientService],
})
export class NotificationModule {}
