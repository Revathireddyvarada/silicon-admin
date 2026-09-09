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

export class CreateFaqDto {
  @ApiProperty({ example: "What is SiliconDrive?", type: String })
  @IsString({ message: "questionName must be a string" })
  @IsNotEmpty({ message: "questionName is required" })
  questionName!: string;

  @ApiProperty({
    example: "SiliconDrive is a platform for managing rides.",
    type: String,
  })
  @IsString({ message: "answer must be a string" })
  @IsNotEmpty({ message: "answer is required" })
  answer!: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;

  @ApiPropertyOptional({ example: "customer", enum: ["customer", "driver", "vendor"] })
  @IsOptional()
  @IsIn(["customer", "driver", "vendor"], {
    message: "userType must be customer or driver or vendor",
  })
  userType?: "customer" | "driver" | "vendor";
}

export class UpdateFaqDto {
  @ApiPropertyOptional({ example: "What is SiliconDrive?", type: String })
  @IsOptional()
  @IsString({ message: "questionName must be a string" })
  @IsNotEmpty({ message: "questionName cannot be empty" })
  questionName?: string;

  @ApiPropertyOptional({
    example: "SiliconDrive is a platform for managing rides.",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "answer must be a string" })
  @IsNotEmpty({ message: "answer cannot be empty" })
  answer?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;

  @ApiPropertyOptional({ example: "customer", enum: ["customer", "driver", "vendor"] })
  @IsOptional()
  @IsIn(["customer", "driver", "vendor", "vendor"], {
    message: "userType must be customer, driver, or vendor, or vendor",
  })
  userType?: "customer" | "driver" | "vendor";
}

export class FaqQueryDto {
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

  @ApiPropertyOptional({ example: "silicon", type: String })
  @IsOptional()
  @IsString({ message: "search must be a string" })
  search?: string;

  @ApiPropertyOptional({
    example: "createdAt",
    enum: ["id", "questionName", "answer", "createdAt", "updatedAt"],
  })
  @IsOptional()
  @IsIn(["id", "questionName", "answer", "createdAt", "updatedAt"], {
    message: "sortBy must be id, questionName, answer, createdAt, or updatedAt",
  })
  sortBy?: "id" | "questionName" | "answer" | "createdAt" | "updatedAt" =
    "createdAt";

  @ApiPropertyOptional({ example: "DESC", enum: ["ASC", "DESC"] })
  @IsOptional()
  @IsIn(["ASC", "DESC"], { message: "sortOrder must be ASC or DESC" })
  sortOrder?: "ASC" | "DESC" = "DESC";

  @ApiPropertyOptional({ example: "customer", enum: ["customer", "driver", "vendor"] })
  @IsOptional()
  @IsIn(["customer", "driver", "vendor", "vendor"], {
    message: "userType must be customer, driver, or vendor or vendor",
  })
  userType?: "customer" | "driver" | "vendor";
}
