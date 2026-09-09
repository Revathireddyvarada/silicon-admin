import { IsString, IsOptional, IsBoolean, IsUUID, IsNotEmpty, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateStateDto {
  @ApiProperty({ description: "State name", example: "Karnataka", required: true, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "state_name is required and must not be empty" })
  @IsString()
  @MaxLength(255)
  state_name!: string;

  @ApiProperty({ description: "State description", example: "A state in India", required: false, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Whether the state is active", required: false, type: Boolean })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
