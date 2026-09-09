import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UploadSide } from "../../entities/vehicle-document-type.entity";

export class CreateVehicleDocumentTypeDto {
  @ApiProperty({ example: "COVID-19 Certification Proof", type: String })
  @IsString({ message: "documentName must be a string" })
  @IsNotEmpty({ message: "documentName is required" })
  documentName!: string;

  @ApiProperty({
    example: true,
    type: Boolean,
    description: "Document Number — Yes/No",
  })
  @IsBoolean({ message: "documentNumber must be a boolean" })
  documentNumber!: boolean;

  @ApiProperty({
    example: false,
    type: Boolean,
    description: "Expiry Date — Yes/No",
  })
  @IsBoolean({ message: "expiryDate must be a boolean" })
  expiryDate!: boolean;

  @ApiProperty({
    example: "front",
    enum: ["front", "back", "both_side"],
    type: String,
    description: "Document Upload — Front / Back / Both Side",
  })
  @IsEnum(["front", "back", "both_side"], {
    message: "uploadSide must be front, back, or both_side",
  })
  @IsNotEmpty({ message: "uploadSide is required" })
  uploadSide!: UploadSide;

  @ApiPropertyOptional({ example: false, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isMandatory must be a boolean" })
  isMandatory?: boolean;

  @ApiProperty({
    example: true,
    type: Boolean,
    description: "false = static (FE hardcode), true = dynamic (admin added)",
  })
  @IsBoolean({ message: "status must be a boolean" })
  status!: boolean;
}

export class UpdateVehicleDocumentTypeDto {
  @ApiPropertyOptional({
    example: "COVID-19 Certification Proof",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "documentName must be a string" })
  @IsNotEmpty({ message: "documentName cannot be empty" })
  documentName?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "documentNumber must be a boolean" })
  documentNumber?: boolean;

  @ApiPropertyOptional({ example: false, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "expiryDate must be a boolean" })
  expiryDate?: boolean;

  @ApiPropertyOptional({
    example: "both_side",
    enum: ["front", "back", "both_side"],
    type: String,
  })
  @IsOptional()
  @IsEnum(["front", "back", "both_side"], {
    message: "uploadSide must be front, back, or both_side",
  })
  uploadSide?: UploadSide;

  @ApiPropertyOptional({ example: false, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isMandatory must be a boolean" })
  isMandatory?: boolean;

  @ApiPropertyOptional({
    example: true,
    type: Boolean,
    description: "false = static, true = dynamic",
  })
  @IsOptional()
  @IsBoolean({ message: "status must be a boolean" })
  status?: boolean;
}