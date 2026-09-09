import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateRejectionReasonDto {
  @ApiProperty({ example: "Vehicle breakdown", type: String })
  @IsString({ message: "reason must be a string" })
  @IsNotEmpty({ message: "reason is required" })
  reason!: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}

export class UpdateRejectionReasonDto {
  @ApiPropertyOptional({ example: "Vehicle breakdown", type: String })
  @IsOptional()
  @IsString({ message: "reason must be a string" })
  @IsNotEmpty({ message: "reason cannot be empty" })
  reason?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}

export class RejectionReasonQueryDto {
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
    example: "vehicle",
    type: String,
    description: "Search by reason",
  })
  @IsOptional()
  @IsString({ message: "search must be a string" })
  search?: string;

  @ApiPropertyOptional({
    example: "createdAt",
    enum: ["id", "reason", "isActive", "createdAt", "updatedAt"],
    description: "Sort by field",
  })
  @IsOptional()
  @IsIn(["id", "reason", "isActive", "createdAt", "updatedAt"], {
    message: "sortBy must be id, reason, isActive, createdAt, or updatedAt",
  })
  sortBy?: "id" | "reason" | "isActive" | "createdAt" | "updatedAt" =
    "createdAt";

  @ApiPropertyOptional({
    example: "DESC",
    enum: ["ASC", "DESC"],
    description: "Sort order (default: DESC)",
  })
  @IsOptional()
  @IsIn(["ASC", "DESC"], { message: "sortOrder must be ASC or DESC" })
  sortOrder?: "ASC" | "DESC" = "DESC";

  @ApiPropertyOptional({
    example: true,
    type: Boolean,
    description: "Filter by active status",
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}
