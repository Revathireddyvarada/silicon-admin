import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  ValidateNested,
  IsNumber,
  IsNotEmpty,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class AdminChangeStatusDto {
  @ApiProperty({
    example: "in_progress",
    enum: ["open", "in_progress", "resolved", "closed"],
  })
  @IsEnum(["open", "in_progress", "resolved", "closed"], {
    message: "status must be one of: open, in_progress, resolved, closed",
  })
  status!: string;
}

export class AdminAssignStaffDto {
  @ApiProperty({ example: "uuid-of-staff" })
  @IsUUID()
  staffId!: string;
}

export class AdminTicketAttachmentPayloadDto {
  @ApiProperty({ example: "https://cdn.example.com/screenshot.png" })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}

export class AdminCreateTicketPayloadDto {
  @ApiProperty({ example: "Payment not processing" })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiPropertyOptional({ example: "id-of-trip" })
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ example: "uuid-of-category" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: "Payment fails at checkout." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "admin" })
  @IsOptional()
  @IsString()
  createType?: string;

  @ApiPropertyOptional({ example: "uuid-of-staff" })
  @IsOptional()
  @IsUUID()
  assignTo?: string;

  @ApiPropertyOptional({ type: [AdminTicketAttachmentPayloadDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdminTicketAttachmentPayloadDto)
  attachments?: AdminTicketAttachmentPayloadDto[];
}

export class AdminUpdateTicketPayloadDto {
  @ApiPropertyOptional({ example: "Updated subject" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subject?: string;

  @ApiPropertyOptional({ example: "id-of-trip" })
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ example: "uuid-of-category" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: "Updated description." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "admin" })
  @IsOptional()
  @IsString()
  createType?: string;

  @ApiPropertyOptional({ example: "uuid-of-staff" })
  @IsOptional()
  @IsUUID()
  assignTo?: string;

  @ApiPropertyOptional({ type: [AdminTicketAttachmentPayloadDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdminTicketAttachmentPayloadDto)
  attachments?: AdminTicketAttachmentPayloadDto[];
}
export class AdminReplyAttachmentDto {
  @ApiProperty({ example: "https://cdn.example.com/screenshot.png" })
  @IsString()
  fileUrl!: string;
}

export class AdminReplyDto {
  @ApiPropertyOptional({ example: "We are looking into the issue." })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ type: AdminReplyAttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminReplyAttachmentDto)
  attachment?: AdminReplyAttachmentDto;
}

export class AdminTicketQueryDto {
  @ApiPropertyOptional({ example: "trip" })
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

  @ApiPropertyOptional({
    example: "2025-01-01",
    description: "From date (YYYY-MM-DD)",
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: "2025-12-31",
    description: "To date (YYYY-MM-DD)",
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class AdminTicketPaginationDto extends AdminTicketQueryDto {
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

  @ApiPropertyOptional({ example: "uuid-of-assignee" })
  @IsOptional()
  @IsUUID()
  assignTo?: string;
}

export class AdminTicketCursorDto extends AdminTicketQueryDto {
  @ApiPropertyOptional({ example: 10, description: "Items per page (default 10, max 100)" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: "Opaque nextCursor from previous response",
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ example: "uuid-of-assignee" })
  @IsOptional()
  @IsUUID()
  assignTo?: string;
}

export class AdminEditConversationDto {
  @ApiPropertyOptional({ example: "Updated message content." })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ type: AdminReplyAttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminReplyAttachmentDto)
  attachment?: AdminReplyAttachmentDto;
}
