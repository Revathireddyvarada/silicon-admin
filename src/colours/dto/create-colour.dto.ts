import { IsString, IsOptional, IsBoolean, IsUUID, IsNotEmpty, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateColourDto {
  @ApiProperty({ description: "Colour name", example: "Red", required: true, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "colour_name is required and must not be empty" })
  @IsString()
  @MaxLength(255)
  colour_name!: string;

  @ApiProperty({ description: "Colour description", example: "A colour in the palette", required: false, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Whether the colour is active", required: false, type: Boolean })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
