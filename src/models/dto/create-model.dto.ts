import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsUUID, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateModelDto {
  @ApiProperty({ description: "Model name", example: "Corolla", required: true, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "model_name is required and must not be empty" })
  @IsString()
  @MaxLength(255)
  model_name!: string;

  @ApiProperty({ description: "Brand UUID", example: "uuid-here", required: true, type: String })
  @IsNotEmpty({ message: "brand_id is required" })
  @IsUUID()
  brand_id!: string;

  @ApiProperty({ description: "Whether the model is active", required: false, type: Boolean })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}