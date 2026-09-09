import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DriverDocumentType } from "../entities/driver-document-type.entity";
import { DriverDocumentTypeService } from "./driver-document-type.service";
import { DriverDocumentTypeController } from "./driver-document-type.controller";

@Module({
  imports: [TypeOrmModule.forFeature([DriverDocumentType])],
  controllers: [DriverDocumentTypeController],
  providers: [DriverDocumentTypeService],
  exports: [DriverDocumentTypeService],
})
export class DriverDocumentTypeModule {}