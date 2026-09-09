import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpsertSmtpSettingsDto {
  @ApiProperty({ example: "sunil.kumar@silicon.com", type: String })
  @IsEmail({}, { message: "fromMailId must be a valid email" })
  @IsNotEmpty({ message: "fromMailId is required" })
  fromMailId!: string;

  @ApiProperty({ example: "smtp.zoho.in", type: String })
  @IsString({ message: "host must be a string" })
  @IsNotEmpty({ message: "host is required" })
  host!: string;

  @ApiProperty({ example: "hello@silicondrive.com", type: String })
  @IsString({ message: "userName must be a string" })
  @IsNotEmpty({ message: "userName is required" })
  userName!: string;

  @ApiProperty({ example: "yourpassword", type: String })
  @IsString({ message: "password must be a string" })
  @IsNotEmpty({ message: "password is required" })
  password!: string;

  @ApiProperty({ example: 209, type: Number })
  @Type(() => Number)
  @IsInt({ message: "port must be an integer" })
  @Min(1, { message: "port must be at least 1" })
  @Max(65535, { message: "port must be at most 65535" })
  port!: number;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}
