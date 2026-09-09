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

export class CreateCmsDto {
  @ApiProperty({ example: "Privacy Policy", type: String })
  @IsString({ message: "title must be a string" })
  @IsNotEmpty({ message: "title is required" })
  title!: string;

  @ApiProperty({ example: "privacy-policy", type: String })
  @IsString({ message: "urlIndex must be a string" })
  @IsNotEmpty({ message: "urlIndex is required" })
  urlIndex!: string;

  @ApiProperty({ example: "This is the privacy policy page.", type: String })
  @IsString({ message: "description must be a string" })
  @IsNotEmpty({ message: "description is required" })
  description!: string;

  @ApiProperty({ example: "privacy, policy, terms", type: String })
  @IsString({ message: "metaKey must be a string" })
  @IsNotEmpty({ message: "metaKey is required" })
  metaKey!: string;

  @ApiProperty({ example: "Read our privacy policy.", type: String })
  @IsString({ message: "metaDescription must be a string" })
  @IsNotEmpty({ message: "metaDescription is required" })
  metaDescription!: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}

export class UpdateCmsDto {
  @ApiPropertyOptional({ example: "Privacy Policy", type: String })
  @IsOptional()
  @IsString({ message: "title must be a string" })
  @IsNotEmpty({ message: "title cannot be empty" })
  title?: string;

  @ApiPropertyOptional({ example: "privacy-policy", type: String })
  @IsOptional()
  @IsString({ message: "urlIndex must be a string" })
  @IsNotEmpty({ message: "urlIndex cannot be empty" })
  urlIndex?: string;

  @ApiPropertyOptional({
    example: "This is the privacy policy page.",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "description must be a string" })
  @IsNotEmpty({ message: "description cannot be empty" })
  description?: string;

  @ApiPropertyOptional({ example: "privacy, policy, terms", type: String })
  @IsOptional()
  @IsString({ message: "metaKey must be a string" })
  @IsNotEmpty({ message: "metaKey cannot be empty" })
  metaKey?: string;

  @ApiPropertyOptional({ example: "Read our privacy policy.", type: String })
  @IsOptional()
  @IsString({ message: "metaDescription must be a string" })
  @IsNotEmpty({ message: "metaDescription cannot be empty" })
  metaDescription?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;

  @ApiPropertyOptional({ example: false, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isDelete must be a boolean" })
  isDelete?: boolean;
}

export class CmsQueryDto {
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
    example: "privacy",
    type: String,
    description: "Search by title or description",
  })
  @IsOptional()
  @IsString({ message: "search must be a string" })
  search?: string;

  @ApiPropertyOptional({
    example: "createdAt",
    enum: ["title", "urlIndex", "createdAt"],
    description: "Sort by field",
  })
  @IsOptional()
  @IsIn(["title", "urlIndex", "createdAt"], {
    message: "sortBy must be title, urlIndex, or createdAt",
  })
  sortBy?: "title" | "urlIndex" | "createdAt" = "createdAt";

  @ApiPropertyOptional({
    example: "DESC",
    enum: ["ASC", "DESC"],
    description: "Sort order (default: DESC)",
  })
  @IsOptional()
  @IsIn(["ASC", "DESC"], { message: "sortOrder must be ASC or DESC" })
  sortOrder?: "ASC" | "DESC" = "DESC";
}
