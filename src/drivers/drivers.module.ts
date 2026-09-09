import { Module } from "@nestjs/common";
import { DriverService } from "./drivers.service";
import { DriversController } from "./drivers.controller";
import { ActivityLogModule } from "../activity-log/activity-log.module";
import { CitiesModule } from "../cities/cities.module";
import { NotificationModule } from "../send-notification/send-notification.module";

@Module({
  imports: [ActivityLogModule, CitiesModule, NotificationModule],
  controllers: [DriversController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
