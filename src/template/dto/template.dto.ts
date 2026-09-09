import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsIn,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DeliveryMethod } from "../../entities/template.entity";

export class CreateTemplateDto {
  @ApiProperty({
    example: "email",
    enum: ["email", "sms", "mobile_push_notification"],
    type: String,
  })
  @IsEnum(["email", "sms", "mobile_push_notification"], {
    message: "deliveryMethod must be email, sms, or mobile_push_notification",
  })
  @IsNotEmpty({ message: "deliveryMethod is required" })
  deliveryMethod!: DeliveryMethod;

  @ApiProperty({ example: "Welcome Email", type: String })
  @IsString({ message: "templateName must be a string" })
  @IsNotEmpty({ message: "templateName is required" })
  templateName!: string;

  @ApiProperty({ example: "Welcome to SiliconDrive!", type: String })
  @IsString({ message: "subject must be a string" })
  @IsNotEmpty({ message: "subject is required" })
  subject!: string;

  @ApiProperty({ example: "Hi john, welcome to SiliconDrive.", type: String })
  @IsString({ message: "message must be a string" })
  @IsNotEmpty({ message: "message is required" })
  message!: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    example: "sms",
    enum: ["email", "sms", "mobile_push_notification"],
    type: String,
  })
  @IsOptional()
  @IsEnum(["email", "sms", "mobile_push_notification"], {
    message: "deliveryMethod must be email, sms, or mobile_push_notification",
  })
  deliveryMethod?: DeliveryMethod;

  @ApiPropertyOptional({ example: "Welcome Email", type: String })
  @IsOptional()
  @IsString({ message: "templateName must be a string" })
  @IsNotEmpty({ message: "templateName cannot be empty" })
  templateName?: string;

  @ApiPropertyOptional({ example: "Welcome to SiliconDrive!", type: String })
  @IsOptional()
  @IsString({ message: "subject must be a string" })
  @IsNotEmpty({ message: "subject cannot be empty" })
  subject?: string;

  @ApiPropertyOptional({
    example: "Hi john, welcome to SiliconDrive.",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "message must be a string" })
  @IsNotEmpty({ message: "message cannot be empty" })
  message?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}

export class TemplateQueryDto {
  @ApiPropertyOptional({
    example: 1,
    type: Number,
    description: "Page number (default: 1)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "page must be an integer" })
  @Min(1, { message: "page must be at least 1" })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    type: Number,
    description: "Items per page (default: 10)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "limit must be an integer" })
  @Min(1, { message: "limit must be at least 1" })
  limit?: number = 10;

  @ApiPropertyOptional({
    example: "welcome",
    type: String,
    description: "Search by templateName or subject",
  })
  @IsOptional()
  @IsString({ message: "search must be a string" })
  search?: string;

  @ApiPropertyOptional({
    example: "createdAt",
    enum: ["templateName", "deliveryMethod", "createdAt", "updatedAt"],
    description: "Sort by field",
  })
  @IsOptional()
  @IsIn(["templateName", "deliveryMethod", "createdAt", "updatedAt"], {
    message:
      "sortBy must be templateName, deliveryMethod, createdAt, or updatedAt",
  })
  sortBy?: "templateName" | "deliveryMethod" | "createdAt" | "updatedAt" =
    "createdAt";

  @ApiPropertyOptional({
    example: "DESC",
    enum: ["ASC", "DESC"],
    description: "Sort order (default: DESC)",
  })
  @IsOptional()
  @IsIn(["ASC", "DESC"], { message: "sortOrder must be ASC or DESC" })
  sortOrder?: "ASC" | "DESC" = "DESC";
}
