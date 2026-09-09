import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsNotEmpty,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CustomerChangeStatusDto {
  @ApiProperty({ enum: ["open", "in_progress", "resolved", "closed"] })
  @IsEnum(["open", "in_progress", "resolved", "closed"], {
    message: "status must be one of: open, in_progress, resolved, closed",
  })
  status!: string;
}

export class CustomerAssignStaffDto {
  @ApiProperty({ example: "uuid-of-staff" })
  @IsUUID()
  staffId!: string;
}

export class AdminCreateCustomerTicketHttpDto {
  @ApiProperty({ example: "Payment not processed" })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiPropertyOptional({ example: "uuid-of-category" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: "The fare was deducted twice." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "uuid-of-staff" })
  @IsOptional()
  @IsUUID()
  assignTo?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["uuid-of-ride-1", "uuid-of-ride-2"],
    description: "One or more ride UUIDs",
  })
  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  rideIds?: string[];
}

export class AdminUpdateCustomerTicketHttpDto {
  @ApiPropertyOptional({ example: "Updated subject" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subject?: string;

  @ApiPropertyOptional({ example: "uuid-of-category" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: "Updated description." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "uuid-of-staff" })
  @IsOptional()
  @IsUUID()
  assignTo?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["uuid-of-ride-1"],
    description: "One or more ride UUIDs",
  })
  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  rideIds?: string[];
}

export class CustomerAdminReplyDto {
  @ApiPropertyOptional({ example: "We are looking into it." })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    example: "uuid-of-ride",
    description: "Optional ride UUID to associate with this message",
  })
  @IsOptional()
  @IsUUID()
  rideId?: string;
}

export class CustomerEditConversationDto {
  @ApiPropertyOptional({ example: "Updated message content." })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message?: string;
}

export class CustomerTicketHttpQueryDto {
  @ApiPropertyOptional({ example: "payment" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "open",
    enum: ["open", "in_progress", "resolved", "closed"],
  })
  @IsOptional()
  @IsEnum(["open", "in_progress", "resolved", "closed"])
  status?: string;

  @ApiPropertyOptional({ example: "uuid-of-category" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: "2025-01-01" })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: "2025-12-31" })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ example: "uuid-of-ride" })
  @IsOptional()
  @IsUUID()
  rideId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class CustomerTicketHttpPaginationDto extends CustomerTicketHttpQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ example: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ["ASC", "DESC"], example: "DESC" })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC";
}
