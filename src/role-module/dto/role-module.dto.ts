import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateRolesModuleDto {
  @ApiProperty({ example: "Driver Management", type: String })
  @IsString()
  @IsNotEmpty({ message: "moduleName is required" })
  moduleName!: string;

  @ApiPropertyOptional({ example: "uuid-of-parent-module", type: String })
  @IsOptional()
  @IsUUID("4")
  parentId?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
