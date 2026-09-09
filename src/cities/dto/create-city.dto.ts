import { IsString, IsNotEmpty, IsUUID, IsBoolean, IsOptional, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCityDto {
  @ApiProperty({ type: String, example: "Bangalore" })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "city_name is required and must not be empty" })
  @IsString()
  @MaxLength(255)
  city_name!: string;

  @ApiProperty({ type: String, example: "uuid-of-state" })  
  @IsUUID()
  @IsNotEmpty()
  state_id!: string;

  @ApiPropertyOptional({ type: Boolean, example: true })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}