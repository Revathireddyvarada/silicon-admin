import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VehicleDocumentType } from "../entities/vehicle-document-type.entity";
import { VehicleDocumentTypeService } from "./vehicle-document-type.service";
import { VehicleDocumentTypeController } from "./vehicle-document-type.controller";

@Module({
  imports: [TypeOrmModule.forFeature([VehicleDocumentType])],
  controllers: [VehicleDocumentTypeController],
  providers: [VehicleDocumentTypeService],
  exports: [VehicleDocumentTypeService],
})
export class VehicleDocumentTypeModule {}