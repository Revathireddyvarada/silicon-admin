import { IsNumber, IsEnum, IsPositive, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PlatformFeeType } from "../../entities/b2b-fare-settings.entity";

export class UpsertB2bFareSettingsDto {
  @ApiProperty({
    example: 5,
    type: Number,
    description: "GST Percentage for trips (%)",
  })
  @Type(() => Number)
  @IsNumber({}, { message: "gstPercentage must be a number" })
  @Min(0, { message: "gstPercentage must be >= 0" })
  @Max(100, { message: "gstPercentage must be <= 100" })
  gstPercentage!: number;

  @ApiProperty({
    example: "amount",
    enum: ["amount", "percentage"],
    description: "Platform fee type — Enter Number (₹) or Percentage (%)",
  })
  @IsEnum(["amount", "percentage"], {
    message: "platformFeeType must be amount or percentage",
  })
  platformFeeType!: PlatformFeeType;

  @ApiProperty({
    example: 100,
    type: Number,
    description: "Platform fee value (₹ or %)",
  })
  @Type(() => Number)
  @IsNumber({}, { message: "platformFeeValue must be a number" })
  @IsPositive({ message: "platformFeeValue must be positive" })
  platformFeeValue!: number;

  @ApiProperty({
    example: 10,
    type: Number,
    description: "No show driver commission for fares above ₹500 (%)",
  })
  @Type(() => Number)
  @IsNumber({}, { message: "noShowDriverCommissionAbove500 must be a number" })
  @Min(0, { message: "noShowDriverCommissionAbove500 must be >= 0" })
  @Max(100, { message: "noShowDriverCommissionAbove500 must be <= 100" })
  noShowDriverCommissionAbove500!: number;

  @ApiProperty({
    example: 50,
    type: Number,
    description: "No show driver commission for fares below or equal to ₹500 (₹, fixed amount)",
  })
  @Type(() => Number)
  @IsNumber({}, { message: "noShowDriverCommissionBelow500 must be a number" })
  @Min(0, { message: "noShowDriverCommissionBelow500 must be >= 0" })
  noShowDriverCommissionBelow500!: number;
}