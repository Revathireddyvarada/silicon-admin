import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTripRatingReasonDto {
  @ApiProperty({ description: "Reason text", example: "Late arrival", required: true, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "reason is required and must not be empty" })
  @IsString()
  @MaxLength(255)
  reason!: string;

  @ApiProperty({ description: "Reason description", example: "Driver arrived more than 10 minutes late", required: false, type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Whether the reason is active", required: false, type: Boolean })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
