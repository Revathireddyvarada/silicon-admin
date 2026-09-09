import { IsString, IsEmail, IsOptional, IsNotEmpty, MinLength, IsEnum } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { UserType, UserStatus } from "../../entities/user.entity";

export class CreateUserDto {
  @ApiProperty({ description: "Full name", example: "John Doe", required: true, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "name is required and must not be empty" })
  @IsString()
  name!: string;

  @ApiProperty({ description: "Email", example: "john@silicondrive.com", required: true, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "email is required and must not be empty" })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: "Phone country code (e.g. +1, +91)", example: "+91", required: false, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  phoneCountryCode?: string;

  @ApiProperty({ description: "Phone number", example: "1234567890", required: true, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "phoneNumber is required and must not be empty" })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ description: "Password (min 8 chars)", example: "SecurePassword123!", minLength: 8, required: true, type: String })
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsNotEmpty({ message: "password is required" })
  @IsString()
  @MinLength(8, { message: "password must be at least 8 characters" })
  password!: string;

  @ApiProperty({ description: "User type (1=super_admin, 2=admin, 3=staff)", enum: UserType, example: UserType.SUPER_ADMIN, required: true })
  @IsNotEmpty({ message: "userType is required" })
  @IsEnum(UserType, { message: "userType must be 1, 2, or 3" })
  userType!: UserType;

  @ApiProperty({ description: "User status (1=active, 2=inactive, 3=suspended, 4=deleted)", enum: UserStatus, example: UserStatus.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(UserStatus, { message: "status must be 1, 2, 3, or 4" })
  status?: UserStatus;
}
