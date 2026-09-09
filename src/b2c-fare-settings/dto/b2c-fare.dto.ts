import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
  IsPositive,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  VehicleType,
  AcType,
} from "../../entities/b2c-km-fare-settings.entity";
import {
  CommissionType,
  NightChargeType,
} from "../../entities/b2c-trip-settings.entity";

export class UpsertB2cKmFareDto {
  @ApiProperty({ example: 0, type: Number, description: "KM range from" })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  kmRangeFrom!: number;

  @ApiPropertyOptional({
    example: 4,
    type: Number,
    description: "KM range to (null = 12km+)",
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  kmRangeTo?: number | null;

  @ApiProperty({ example: "mini", enum: ["mini", "sedan", "suv"] })
  @IsEnum(["mini", "sedan", "suv"], {
    message: "vehicleType must be mini, sedan, or suv",
  })
  vehicleType!: VehicleType;

  @ApiProperty({ example: "ac", enum: ["ac", "non_ac"] })
  @IsEnum(["ac", "non_ac"], { message: "acType must be ac or non_ac" })
  acType!: AcType;

  @ApiProperty({
    example: 12.5,
    type: Number,
    description: "Amount per km (₹)",
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountPerKm!: number;
}

export class BulkUpsertB2cKmFareDto {
  @ApiProperty({ type: [UpsertB2cKmFareDto], description: "All km fare rows" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertB2cKmFareDto)
  fares!: UpsertB2cKmFareDto[];
}

export class UpsertB2cTripSettingsDto {
  @ApiProperty({
    example: 2,
    type: Number,
    description: "Wait charge per minute (₹)",
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  waitChargePerMin!: number;

  @ApiProperty({
    example: 5,
    type: Number,
    description: "Free wait time (minutes)",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  freeWaitTimeMin!: number;

  @ApiProperty({
    example: "percentage",
    enum: ["percentage", "fixed"],
    description: "Commission type",
  })
  @IsEnum(["percentage", "fixed"], {
    message: "commissionType must be percentage or fixed",
  })
  commissionType!: CommissionType;

  @ApiProperty({
    example: 20,
    type: Number,
    description: "Driver commission value",
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  driverCommission!: number;

  @ApiPropertyOptional({
    example: "fixed",
    enum: ["percentage", "fixed"],
    description: "Night charge type (11PM-5AM)",
  })
  @IsOptional()
  @IsEnum(["percentage", "fixed"], {
    message: "nightChargeType must be percentage or fixed",
  })
  nightChargeType?: NightChargeType;

  @ApiPropertyOptional({
    example: 200,
    type: Number,
    description: "Night charge value",
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  nightChargeValue?: number;
}
