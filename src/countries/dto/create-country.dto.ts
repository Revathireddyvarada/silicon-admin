import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCountryDto {
  @ApiProperty({ description: "Country name", example: "India", required: true, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "name is required and must not be empty" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: "ISO country code", example: "IN", required: true, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "code is required and must not be empty" })
  @IsString()
  @MaxLength(10)
  code!: string;

  @ApiProperty({ description: "Whether the country is active", required: false, type: Boolean })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
