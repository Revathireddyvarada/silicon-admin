import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ZoneLatLngDto {
  @ApiProperty({ example: 12.9716 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: 77.5946 })
  @IsNumber()
  lng!: number;
}

export class CreateZoneDto {
  @ApiProperty({ example: "Airport Zone" })
  @Transform(({ value }) =>
    value === "" || value === null ? undefined : value,
  )
  @IsNotEmpty({ message: "zone_name is required" })
  @IsString()
  @MaxLength(255)
  zone_name!: string;

  @ApiProperty({ example: "uuid-of-state" })
  @IsUUID()
  @IsNotEmpty()
  state_id!: string;

  @ApiProperty({ example: "uuid-of-city" })
  @IsUUID()
  @IsNotEmpty()
  city_id!: string;

  @ApiProperty({
    type: [ZoneLatLngDto],
    description: "Polygon vertices from map draw (min 3). First≠last OK; server closes ring.",
  })
  @IsArray()
  @ArrayMinSize(3, { message: "polygon_paths must have at least 3 points" })
  @ValidateNested({ each: true })
  @Type(() => ZoneLatLngDto)
  polygon_paths!: ZoneLatLngDto[];

  @ApiPropertyOptional({ type: Boolean, example: true })
  @Transform(({ value }) =>
    value === "" || value === null ? undefined : value,
  )
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
