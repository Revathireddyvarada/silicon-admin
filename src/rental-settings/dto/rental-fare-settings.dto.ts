import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  IsPositive,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { RentalVehicleType } from "../../entities/rental-fare-settings.entity";
import {
  RentalCommissionType,
  RentalNightChargeType,
} from "../../entities/rental-trip-settings.entity";

// ─────────────────────────────────────────
// RENTAL PACKAGE
// ─────────────────────────────────────────
export class CreateRentalPackageDto {
  @ApiProperty({ example: 1, type: Number, description: "Hours (1, 2, 3...)" })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  hours!: number;

  @ApiProperty({ example: 15, type: Number, description: "Included KM" })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  includedKm!: number;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRentalPackageDto {
  @ApiPropertyOptional({ example: 20, type: Number })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsPositive()
  includedKm?: number;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─────────────────────────────────────────
// RENTAL FARE SETTINGS — per vehicle
// ─────────────────────────────────────────
export class UpsertRentalFareDto {
  @ApiProperty({ example: "mini", enum: ["mini", "sedan", "suv"] })
  @IsEnum(["mini", "sedan", "suv"], {
    message: "vehicleType must be mini, sedan, or suv",
  })
  vehicleType!: RentalVehicleType;

  @ApiPropertyOptional({
    example: 10,
    type: Number,
    description: "Non-AC per km (₹)",
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  nonAcPerKm?: number;

  @ApiPropertyOptional({
    example: 12,
    type: Number,
    description: "AC per km (₹)",
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  acPerKm?: number;

  @ApiPropertyOptional({
    example: 100,
    type: Number,
    description: "Non-AC per hour (₹)",
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  nonAcPerHour?: number;

  @ApiPropertyOptional({
    example: 120,
    type: Number,
    description: "AC per hour (₹)",
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  acPerHour?: number;

  @ApiPropertyOptional({
    example: 8,
    type: Number,
    description: "Extra distance fare per km (₹)",
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraDistanceFareKm?: number;

  @ApiPropertyOptional({
    example: 2,
    type: Number,
    description: "Extra time fare per min (₹)",
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraTimeFareMin?: number;
}

export class BulkUpsertRentalFareDto {
  @ApiProperty({
    type: [UpsertRentalFareDto],
    description: "Fare rows for mini, sedan, suv",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertRentalFareDto)
  fares!: UpsertRentalFareDto[];
}

// ─────────────────────────────────────────
// RENTAL TRIP SETTINGS — upsert single
// ─────────────────────────────────────────
export class UpsertRentalTripSettingsDto {
  @ApiProperty({
    example: 2,
    type: Number,
    description: "Wait charge per min (₹)",
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  waitChargePerMin!: number;

  @ApiProperty({
    example: 5,
    type: Number,
    description: "Free wait time (min)",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  freeWaitTimeMin!: number;

  @ApiProperty({ example: "percentage", enum: ["percentage", "fixed"] })
  @IsEnum(["percentage", "fixed"], {
    message: "commissionType must be percentage or fixed",
  })
  commissionType!: RentalCommissionType;

  @ApiProperty({ example: 20, type: Number })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  driverCommission!: number;

  @ApiPropertyOptional({ example: "fixed", enum: ["percentage", "fixed"] })
  @IsOptional()
  @IsEnum(["percentage", "fixed"])
  nightChargeType?: RentalNightChargeType;

  @ApiPropertyOptional({ example: 200, type: Number })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  nightChargeValue?: number;
}
