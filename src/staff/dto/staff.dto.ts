import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUUID,
  IsIn,
  MinLength,
  IsDateString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

// ─────────────────────────────────────────
// CREATE STAFF
// ─────────────────────────────────────────
export class CreateStaffDto {
  @ApiProperty({ example: "John", type: String })
  @IsString()
  @IsNotEmpty({ message: "firstName is required" })
  firstName!: string;

  @ApiPropertyOptional({ example: "Doe", type: String })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: "john@example.com", type: String })
  @IsEmail({}, { message: "Invalid email" })
  @IsNotEmpty({ message: "email is required" })
  email!: string;


  @ApiPropertyOptional({ example: "+91", type: String })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: "9876543210", type: String })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: "uuid-of-role", type: String })
  @IsOptional()
  @IsUUID("4", { message: "roleId must be a valid UUID" })
  roleId?: string;

  @ApiPropertyOptional({ example: 1, description: "1=Male, 2=Female, 3=Other" })
  @IsOptional()
  @Type(() => Number)
  gender?: number;

  @ApiPropertyOptional({ example: "2024-01-01", type: String })
  @IsOptional()
  @IsDateString()
  dateOfJoined?: string;

  @ApiPropertyOptional({ example: "123 Main St", type: String })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ example: "Apt 4B", type: String })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: "uuid-of-city", type: String })
  @IsOptional()
  @IsUUID("4", { message: "cityId must be a valid UUID" })
  cityId?: string;

  @ApiPropertyOptional({ example: "600001", type: String })
  @IsOptional()
  @IsString()
  pinCode?: string;

  @ApiPropertyOptional({
    example: "uploads/profile.jpg",
    type: String,
    description: "Image path or URL",
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

// ─────────────────────────────────────────
// UPDATE STAFF
// ─────────────────────────────────────────
export class UpdateStaffDto {
  @ApiPropertyOptional({ example: "John", type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({ example: "Doe", type: String })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: "john@example.com", type: String })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "+91", type: String })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: "9876543210", type: String })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: "uuid-of-role", type: String })
  @IsOptional()
  @IsUUID("4")
  roleId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  gender?: number;

  @ApiPropertyOptional({ example: "2024-01-01", type: String })
  @IsOptional()
  @IsDateString()
  dateOfJoined?: string;

  @ApiPropertyOptional({ example: "123 Main St", type: String })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ example: "Apt 4B", type: String })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: "uuid-of-city", type: String })
  @IsOptional()
  @IsUUID("4")
  cityId?: string;

  @ApiPropertyOptional({ example: "600001", type: String })
  @IsOptional()
  @IsString()
  pinCode?: string;

  @ApiPropertyOptional({
    example: "uploads/profile.jpg",
    type: String,
    description: "Image path or URL",
  })
  @IsOptional()
  @IsString()
  image?: string;
  
  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

// ─────────────────────────────────────────
// CHANGE STATUS
// ─────────────────────────────────────────
export class ChangeStaffStatusDto {
  @ApiProperty({ example: true, type: Boolean })
  @IsBoolean({ message: "status must be a boolean" })
  status!: boolean;
}

// ─────────────────────────────────────────
// PAGINATION QUERY
// ─────────────────────────────────────────
export class StaffPaginationDto {
  @ApiPropertyOptional({ example: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, type: Number })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ example: "John", type: String })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "firstName",
    enum: [
      "id",
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "roleId",
      "image",
      "createdAt",
      "updatedAt",
    ],
  })
  @IsOptional()
  @IsIn([
    "id",
    "firstName",
    "lastName",
    "email",
    "phoneNumber",
    "roleId",
    "image",
    "createdAt",
    "updatedAt",
  ])
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ example: "DESC", enum: ["ASC", "DESC"] })
  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";

  @ApiPropertyOptional({
    example: "uuid-of-role",
    type: String,
    description: "Filter by role ID",
  })
  @IsOptional()
  @IsUUID("4")
  roleId?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Filter by status (1=active, 2=inactive)",
  })
  @IsOptional()
  @Type(() => Number)
  status?: number;
}
