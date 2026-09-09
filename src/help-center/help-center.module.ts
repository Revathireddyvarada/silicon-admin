import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HelpCenter } from "../entities/help-center.entity";
import { HelpCenterService } from "./help-center.service";
import { HelpCenterController } from "./help-center.controller";

@Module({
  imports: [TypeOrmModule.forFeature([HelpCenter])],
  controllers: [HelpCenterController],
  providers: [HelpCenterService],
  exports: [HelpCenterService],
})
export class HelpCenterModule {}
