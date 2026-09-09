import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CancellationReason } from "../entities/cancellation-reason.entity";
import { CancelReasonService } from "./cancel-reason.service";
import { CancelReasonController } from "./cancel-reason.controller";

@Module({
  imports: [TypeOrmModule.forFeature([CancellationReason])],
  controllers: [CancelReasonController],
  providers: [CancelReasonService],
  exports: [CancelReasonService],
})
export class CancelReasonModule {}
