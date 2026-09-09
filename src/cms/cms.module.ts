import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Cms } from "../entities/cms.entity";
import { CmsService } from "./cms.service";
import { CmsController } from "./cms.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Cms])],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
