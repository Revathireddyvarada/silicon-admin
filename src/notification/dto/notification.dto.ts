import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class CreateNotificationDto {
  @ApiProperty({ example: "TRIP_ACCEPTED" })
  @IsString()
  @IsNotEmpty()
  notificationType!: string;

  @ApiProperty({ example: "Trip Accepted" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: "Your trip ID #TRP10245 has been accepted by Vinoth Kumar.",
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    example: "DRIVER", description: "Type of the creator (e.g. DRIVER, FLEET_OWNER, etc.)",
  })
  @IsString()
  @IsOptional()
  creatorType?: string;

  @ApiPropertyOptional({
    example: "61155a57-360b-410e-bd4c-e599c2fac012",
    description: "UUID of the creator (e.g. driver ID, fleet owner ID, etc.)",
  })
  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiPropertyOptional({ example: "770f0611-a41d-63f6-c938-668877662222" })
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @ApiPropertyOptional({
    example: "4d1069c7-b608-4d6f-9b4e-71bf83959b81",
    description: "Vendor UUID (Vendor.id)",
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;
 
  @ApiPropertyOptional({
    example: "VND-00156",
    description: "Vendor human-readable code (Vendor.vendor_id)",
  })
  @IsOptional()
  @IsString()
  vendorCode?: string;

  @ApiPropertyOptional({ example: "660e9500-f30c-52e5-b827-557766551111" })
  @IsOptional()
  @IsString()
  userId?: string;

  // Optional: pass role names to target specific roles; if omitted sends to ALL users
  @ApiPropertyOptional({
    type: [String],
    enum: ["SUPER_ADMIN", "ADMIN", "STAFF"],
    description: "Target recipient roles. If omitted, sends to all active users.",
    example: ["SUPER_ADMIN", "ADMIN"],
  })
  @IsOptional()
  @IsArray()
  @IsIn(["SUPER_ADMIN", "ADMIN", "STAFF"], { each: true })
  recipientRoles?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: "Target specific user UUIDs (staff/admin). Takes precedence over recipientRoles.",
    example: ["61155a57-360b-410e-bd4c-e599c2fac012"],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  recipientIds?: string[];
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: "Search in title or message" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "true = read only, false = unread only",
    example: false,
  })
  @IsOptional()
  // Force string first — enableImplicitConversion + Boolean("false") === true otherwise.
  @Type(() => String)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    const s = String(value).trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
    return undefined;
  })
  @IsBoolean()
  isRead?: boolean;
}