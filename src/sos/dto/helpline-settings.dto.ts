import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpsertHelplineDto {
  @ApiProperty({ example: "080-67890345" })
  @IsOptional()
  @IsString({ message: "helplineNumber must be a string" })
  @IsNotEmpty({ message: "helplineNumber cannot be empty" })
  helplineNumber?: string;

  @ApiProperty({ example: "100" })
  @IsOptional()
  @IsString({ message: "policeHelpline must be a string" })
  @IsNotEmpty({ message: "policeHelpline cannot be empty" })
  policeHelpline?: string;

  @ApiProperty({ example: "108" })
  @IsOptional()
  @IsString({ message: "ambulanceHelpline must be a string" })
  @IsNotEmpty({ message: "ambulanceHelpline cannot be empty" })
  ambulanceHelpline?: string;
}
