import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsUUID,
  IsInt,
  IsDateString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserType, UserStatus } from "../../entities/user.entity";


export class CreateUserDto {
  @ApiProperty({
    description: "First name",
    example: "John",
    required: true,
    type: String,
  })
  @Transform(({ value }) =>
    value === "" || value === null ? undefined : value,
  )
  @IsNotEmpty({ message: "firstName is required and must not be empty" })
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({
    description: "Last name",
    example: "Doe",
    type: String,
  })
  @Transform(({ value }) =>
    value === "" || value === null ? undefined : value,
  )
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: "Email",
    example: "john@silicondrive.com",
    required: true,
    type: String,
  })
  @Transform(({ value }) =>
    value === "" || value === null ? undefined : value,
  )
  @IsNotEmpty({ message: "email is required and must not be empty" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: "Phone country code (e.g. +1, +91)",
    example: "+91",
    type: String,
  })
  @Transform(({ value }) =>
    value === "" || value === null ? undefined : value,
  )
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({
    description: "Phone number",
    example: "1234567890",
    type: String,
  })
  @Transform(({ value }) =>
    value === "" || value === null ? undefined : value,
  )
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: "Password (min 8 chars)",
    example: "SecurePassword123!",
    minLength: 8,
    required: true,
    type: String,
  })
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsNotEmpty({ message: "password is required" })
  @IsString()
  @MinLength(8, { message: "password must be at least 8 characters" })
  password!: string;

  @ApiProperty({
    description: "User type (1=super_admin, 2=admin, 3=staff)",
    enum: UserType,
    example: UserType.SUPER_ADMIN,
    required: true,
  })
  @IsNotEmpty({ message: "userType is required" })
  @IsEnum(UserType, { message: "userType must be 1, 2, or 3" })
  userType!: UserType;

  @ApiPropertyOptional({
    description: "User status (1=active, 2=inactive, 3=suspended, 4=deleted)",
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: "status must be 1, 2, 3, or 4" })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: "Role UUID",
    example: "uuid-of-role",
    type: String,
  })
  @IsOptional()
  @IsUUID("4", { message: "roleId must be a valid UUID" })
  roleId?: string;

  @ApiPropertyOptional({
    description: "Gender (1=Male, 2=Female, 3=Other)",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gender?: number;

  @ApiPropertyOptional({
    description: "Date of joined",
    example: "2024-01-01",
    type: String,
  })
  @IsOptional()
  @IsDateString()
  dateOfJoined?: string;

  @ApiPropertyOptional({
    description: "Address line 1",
    example: "123 Main St",
    type: String,
  })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({
    description: "Address line 2",
    example: "Apt 4B",
    type: String,
  })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({
    description: "City UUID",
    example: "uuid-of-city",
    type: String,
  })
  @IsOptional()
  @IsUUID("4", { message: "cityId must be a valid UUID" })
  cityId?: string;

  @ApiPropertyOptional({
    description: "Pin code",
    example: "600001",
    type: String,
  })
  @IsOptional()
  @IsString()
  pinCode?: string;
}
