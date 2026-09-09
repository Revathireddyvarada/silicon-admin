import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTicketCategoryDto {
  @ApiProperty({ example: "Payment Issue" })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateTicketCategoryDto {
  @ApiPropertyOptional({ example: "Payment Issue" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}