import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsInt,
  IsIn,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  NotificationType,
  UserType,
} from "../../entities/send-notification.entity";

export class SendnotificationDto {
  @ApiProperty({
    example: "email",
    enum: ["email", "mobile_notification"],
    type: String,
  })
  @IsEnum(["email", "mobile_notification"], {
    message: "notificationType must be email or mobile_notification",
  })
  @IsNotEmpty({ message: "notificationType is required" })
  notificationType!: NotificationType;

  @ApiProperty({
    example: "vendors",
    enum: ["vendors", "drivers", "fleet_owners", "b2c_customers"],
    type: String,
  })
  @IsEnum(["vendors", "drivers", "fleet_owners", "b2c_customers"], {
    message:
      "userType must be vendors, drivers, fleet_owners, or b2c_customers",
  })
  @IsNotEmpty({ message: "userType is required" })
  userType!: UserType;

  @ApiPropertyOptional({
    example: ["uuid-1", "uuid-2"],
    description: "Specific recipient IDs. Empty = send to all in userType",
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "recipientIds must be an array" })
  @IsUUID("4", { each: true, message: "Each recipientId must be a valid UUID" })
  recipientIds?: string[];

  @ApiPropertyOptional({
    example: "uuid-of-template",
    type: String,
    description: "Template ID to auto-fill subject & message",
  })
  @IsOptional()
  @IsUUID("4", { message: "templateId must be a valid UUID" })
  templateId?: string;

  @ApiProperty({ example: "Welcome to SiliconDrive!", type: String })
  @IsString({ message: "subject must be a string" })
  @IsNotEmpty({ message: "subject is required" })
  subject!: string;

  @ApiProperty({ example: "Hi, your account is ready.", type: String })
  @IsString({ message: "message must be a string" })
  @IsNotEmpty({ message: "message is required" })
  message!: string;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ example: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "page must be an integer" })
  @Min(1, { message: "page must be at least 1" })
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "limit must be an integer" })
  @Min(1, { message: "limit must be at least 1" })
  limit?: number = 10;

  @ApiPropertyOptional({
    example: "email",
    enum: ["email", "mobile_notification"],
    type: String,
  })
  @IsOptional()
  @IsEnum(["email", "mobile_notification"], {
    message: "notificationType must be email or mobile_notification",
  })
  notificationType?: NotificationType;

  @ApiPropertyOptional({
    enum: [
      "displayId",
      "notificationType",
      "userType",
      "totalRecipients",
      "subject",
      "createdAt",
    ],
    description: "Field to sort by",
  })
  @IsOptional()
  @IsIn([
    "displayId",
    "notificationType",
    "userType",
    "totalRecipients",
    "subject",
    "createdAt",
  ])
  sortBy?: string;

  @ApiPropertyOptional({ enum: ["ASC", "DESC"], description: "Sort direction" })
  @IsOptional()
  @IsIn(["ASC", "DESC", "asc", "desc"])
  sortOrder?: string;
}

export class UsertypeDto {
  @ApiPropertyOptional({
    example: "vendors",
    enum: ["vendors", "drivers", "fleet_owners", "b2c_customers"],
  })
  @IsOptional()
  @IsEnum(["vendors", "drivers", "fleet_owners", "b2c_customers"], {
    message:
      "userType must be vendors, drivers, fleet_owners, or b2c_customers",
  })
  userType?: UserType;
}
