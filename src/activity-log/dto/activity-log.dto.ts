import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsInt, IsUUID } from "class-validator";
import { Type } from "class-transformer";

export class CreateActivityLogDto {
  @ApiProperty({ example: "CREATE", description: "Action type" })
  @IsString()
  @IsNotEmpty()
  action!: string;
 
  @ApiProperty({
    example: "Supervisor Sunil Kumar S has confirmed the trip via Vendor Web App.",
  })
  @IsString()
  @IsNotEmpty()
  description!: string;
 
  @ApiProperty({ example: "Trip", description: "Model/entity name affected" })
  @IsString()
  @IsNotEmpty()
  modelName!: string;
 
  @ApiPropertyOptional({ example: 42, description: "ID of the affected record" })
  @IsOptional()
  @IsInt()
  recordId?: number;
}
 
export class ActivityLogQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;
 
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
 
  @ApiPropertyOptional({ description: "Search in description" })
  @IsOptional()
  @IsString()
  search?: string;
 
  @ApiPropertyOptional({ description: "Filter by model name (e.g. Trip, Driver)" })
  @IsOptional()
  @IsString()
  modelName?: string;
 
  @ApiPropertyOptional({ description: "Filter by the user who triggered the action" })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
 
  @ApiPropertyOptional({ description: "Filter by user type/role name (e.g. Administrator, Supervisor)" })
  @IsOptional()
  @IsString()
  userType?: string;
 
  @ApiPropertyOptional({ enum: ["createdAt", "action", "modelName"], default: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: "createdAt" | "action" | "modelName";
 
  @ApiPropertyOptional({ enum: ["ASC", "DESC"], default: "DESC" })
  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";
 
  @ApiPropertyOptional({ description: "Filter from date (ISO string)" })
  @IsOptional()
  @IsString()
  fromDate?: string;
 
  @ApiPropertyOptional({ description: "Filter to date (ISO string)" })
  @IsOptional()
  @IsString()
  toDate?: string;
}