import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CustomerStatus } from "../common/constants";

export class UpdateCustomerStatusDto {
  @ApiProperty({ enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  status!: CustomerStatus;

  @ApiPropertyOptional({ example: "Violation of terms" })
  @IsOptional()
  @IsString()
  comment?: string;
}
