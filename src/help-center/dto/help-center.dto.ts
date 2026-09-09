import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateHelpCenterDto {
  @ApiProperty({ example: "How do I reset my password?", type: String })
  @IsString({ message: "questionName must be a string" })
  @IsNotEmpty({ message: "questionName is required" })
  questionName!: string;

  @ApiProperty({
    example: "Go to settings and click on reset password.",
    type: String,
  })
  @IsString({ message: "description must be a string" })
  @IsNotEmpty({ message: "description is required" })
  description!: string;

  @ApiPropertyOptional({
    example: "https://example.com/video.mp4",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "videoUrl must be a string" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  videoUrl?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}

export class UpdateHelpCenterDto {
  @ApiPropertyOptional({ example: "How do I reset my password?", type: String })
  @IsOptional()
  @IsString({ message: "questionName must be a string" })
  @IsNotEmpty({ message: "questionName cannot be empty" })
  questionName?: string;

  @ApiPropertyOptional({
    example: "Go to settings and click on reset password.",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "description must be a string" })
  @IsNotEmpty({ message: "description cannot be empty" })
  description?: string;

  @ApiPropertyOptional({
    example: "https://example.com/video.mp4",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "videoUrl must be a string" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  videoUrl?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}

export class HelpCenterQueryDto {
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
    example: "password",
    type: String,
    description: "Search by question or description",
  })
  @IsOptional()
  @IsString({ message: "search must be a string" })
  search?: string;

  @ApiPropertyOptional({
    example: "createdAt",
    enum: ["id", "questionName", "description", "createdAt", "updatedAt"],
    description: "Sort by field",
  })
  @IsOptional()
  @IsIn(["id", "questionName", "description", "createdAt", "updatedAt"], {
    message:
      "sortBy must be id, questionName, description, createdAt, or updatedAt",
  })
  sortBy?: "id" | "questionName" | "description" | "createdAt" | "updatedAt" =
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
