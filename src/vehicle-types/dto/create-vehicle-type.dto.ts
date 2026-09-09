import { IsString, IsInt, IsOptional, IsBoolean, IsNotEmpty, IsEnum, Min, Max } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export enum VehicleAcType {
  NON_AC = 'non_ac',
  AC = 'ac',
}

export class CreateVehicleTypeDto {
  @ApiProperty({ description: "Vehicle type name", example: "Sedan", required: true, type: String })
  @IsNotEmpty({ message: "Vehicle type name is required and must not be empty" })
  @IsString()
  vehicle_type_name!: string;

  @ApiProperty({ description: "Seating capacity", example: 4, minimum: 1, maximum: 20, required: true, type: Number })
  @IsNotEmpty({ message: "seat_count is required and must not be empty" })
  @IsInt()
  @Min(1, { message: "seat_count must be at least 1" })
  @Max(20, { message: "seat_count must be at most 20" })
  seat_count!: number;

  @ApiProperty({ description: "Vehicle AC type", enum: VehicleAcType, example: VehicleAcType.AC, required: true, })
  @IsEnum(VehicleAcType, { message: "type must be either 'ac' or 'non_ac'" })
  type!: VehicleAcType;

  @ApiProperty({ description: "Whether the vehicle type is active", required: false, type: Boolean })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
