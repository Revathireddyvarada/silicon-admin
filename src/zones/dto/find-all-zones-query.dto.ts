import { Transform } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class FindAllZonesQueryDto {
  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsUUID()
  @IsOptional()
  state_id?: string;

  @ApiPropertyOptional({ type: String })
  @IsUUID()
  @IsOptional()
  city_id?: string;

  @ApiPropertyOptional({ type: String, example: "Airport" })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @Transform(({ value }) => (value != null ? Number(value) : 1))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, example: 10 })
  @Transform(({ value }) => (value != null ? Number(value) : 10))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}
