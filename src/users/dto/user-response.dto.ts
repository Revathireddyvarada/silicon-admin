import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserType, UserStatus } from "../../entities/user.entity";

export class UserResponseDto {
  @ApiProperty({ example: "c9c1ebdf-08e1-40b8-b8bf-629c07be08d3", type: String })
  id!: string;

  @ApiProperty({ example: "pub_c9c1ebdf", type: String })
  publicId!: string;

  @ApiProperty({ example: "John", type: String })
  firstName!: string;

  @ApiPropertyOptional({ example: "Doe", type: String })
  lastName!: string | null;

  @ApiProperty({ example: "john@silicondrive.com", type: String })
  email!: string;

  @ApiPropertyOptional({ description: "Phone country code (e.g. +91)", example: "+91", type: String })
  countryCode!: string | null;

  @ApiProperty({ example: "1234567890", type: String })
  phoneNumber!: string;

  @ApiPropertyOptional({ description: "Role UUID", example: "uuid-of-role", type: String })
  roleId!: string | null;

  @ApiPropertyOptional({ description: "Gender (1=Male, 2=Female, 3=Other)", example: 1 })
  gender!: number | null;

  @ApiPropertyOptional({ description: "Date of joined", example: "2024-01-01", type: String })
  dateOfJoined!: Date | null;

  @ApiPropertyOptional({ example: "123 Main St", type: String })
  addressLine1!: string | null;

  @ApiPropertyOptional({ example: "Apt 4B", type: String })
  addressLine2!: string | null;

  @ApiPropertyOptional({ description: "City UUID", type: String })
  cityId!: string | null;

  @ApiPropertyOptional({ example: "600001", type: String })
  pinCode!: string | null;

  @ApiPropertyOptional({ example: "profile.jpg", type: String })
  image!: string | null;

  @ApiProperty({ description: "User type (1=super_admin, 2=admin, 3=staff)", example: UserType.STAFF })
  userType!: number;

  @ApiPropertyOptional({ description: "Last login timestamp", type: String, format: "date-time" })
  lastLoginAt!: Date | null;

  @ApiProperty({ description: "Status (1=active, 2=inactive, 3=suspended, 4=deleted)", example: UserStatus.ACTIVE })
  status!: number;

  @ApiPropertyOptional({ type: String })
  createdBy!: string | null;

  @ApiPropertyOptional({ type: String })
  updatedBy!: string | null;

  @ApiProperty({ example: "2026-03-03T11:20:22.335Z", type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ example: "2026-03-03T11:20:22.335Z", type: String, format: "date-time" })
  updatedAt!: string;
}