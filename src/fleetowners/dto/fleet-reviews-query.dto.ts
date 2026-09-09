import { IsOptional, IsInt, Min, Max, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FleetReviewsQueryDto {

  @ApiPropertyOptional({ description: 'Filter by rating (1-5)', minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ description: 'Filter from date (YYYY-MM-DD)', example: '2025-01-01' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (YYYY-MM-DD)', example: '2025-12-31' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Fleet UUID (if not provided in JWT)' })
  @IsOptional()
  @IsUUID()
  fleetId?: string;
}
