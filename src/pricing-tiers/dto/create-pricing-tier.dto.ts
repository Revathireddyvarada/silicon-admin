import { IsString, IsUUID, IsNumber, IsOptional, IsBoolean, IsNotEmpty, Min } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePricingTierDto {
  @ApiProperty({ description: "Pricing tier name", example: "Mumbai Sedan Standard", required: true, type: String })
  @IsNotEmpty({ message: "name is required and must not be empty" })
  @IsString()
  name!: string;

  @ApiProperty({ description: "City UUID", required: true, type: String })
  @IsNotEmpty({ message: "cityId is required and must not be empty" })
  @IsUUID("4", { message: "cityId must be a valid UUID" })
  cityId!: string;

  @ApiProperty({ description: "Vehicle type UUID", required: true, type: String })
  @IsNotEmpty({ message: "vehicleTypeId is required and must not be empty" })
  @IsUUID("4", { message: "vehicleTypeId must be a valid UUID" })
  vehicleTypeId!: string;

  @ApiProperty({ description: "Base fare amount", example: 50, required: true, type: Number })
  @IsNotEmpty({ message: "baseFare is required and must not be empty" })
  @IsNumber()
  @Min(0, { message: "baseFare must be at least 0" })
  baseFare!: number;

  @ApiProperty({ description: "Rate per km", example: 12.5, required: true, type: Number })
  @IsNotEmpty({ message: "perKmRate is required and must not be empty" })
  @IsNumber()
  @Min(0, { message: "perKmRate must be at least 0" })
  perKmRate!: number;

  @ApiProperty({ description: "Rate per minute", example: 2, required: true, type: Number })
  @IsNotEmpty({ message: "perMinuteRate is required and must not be empty" })
  @IsNumber()
  @Min(0, { message: "perMinuteRate must be at least 0" })
  perMinuteRate!: number;

  @ApiProperty({ description: "Currency code", example: "INR", required: false, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: "Whether active", required: false, type: Boolean })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
