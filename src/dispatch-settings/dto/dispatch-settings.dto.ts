import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsInt, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpsertDispatchSettingsDto {
  @ApiProperty({
    example: 15,
    description: "Geo search radius in km",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  geoSearchRadiusKm?: number;

  @ApiProperty({
    example: 30,
    description: "Pickup ETA speed in km/h",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pickupEtaSpeedKmh?: number;

  @ApiProperty({
    example: 0,
    description: "Pickup ETA buffer in minutes",
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  pickupEtaBufferMinutes?: number;
}
