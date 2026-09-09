import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RejectionReason } from "../entities/rejection-reason.entity";
import { RejectionReasonService } from "./rejection-reason.service";
import { RejectionReasonController } from "./rejection-reason.controller";

@Module({
  imports: [TypeOrmModule.forFeature([RejectionReason])],
  controllers: [RejectionReasonController],
  providers: [RejectionReasonService],
  exports: [RejectionReasonService],
})
export class RejectionReasonModule {}
