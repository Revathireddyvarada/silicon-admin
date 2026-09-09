import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "../entities/notification.entity";
import { UserNotification } from "../entities/user-notification.entity";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { NotificationCleanupScheduler } from "./notification-cleanup.scheduler";
import { User } from "../entities/user.entity";
import { RealtimeHttpModule } from "../realtime/realtime-http.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, UserNotification, User]),
    RealtimeHttpModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationCleanupScheduler],
  exports: [NotificationService],
})
export class InAppNotificationModule {}
