import { Module } from "@nestjs/common";
import { VendorsController } from "./vendors.controller";
import { VendorsWalletController } from "./vendors-wallet.controller";
import { VendorsService } from "./vendors.service";
import { ActivityLogModule } from "../activity-log/activity-log.module";
import { User } from "../entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [ActivityLogModule,TypeOrmModule.forFeature([User])],
  controllers: [VendorsController, VendorsWalletController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
