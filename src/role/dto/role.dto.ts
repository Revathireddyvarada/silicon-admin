import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  IsIn,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class PermissionItemDto {
  @ApiProperty({ example: "uuid-of-module", type: String })
  @IsUUID("4", { message: "moduleId must be a valid UUID" })
  moduleId!: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isAdd?: boolean;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isList?: boolean;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isEdit?: boolean;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isDelete?: boolean;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isView?: boolean;

  // @ApiPropertyOptional({ example: false, type: Boolean })
  // @IsOptional()
  // @IsBoolean()
  // isReply?: boolean;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateRoleDto {
  @ApiProperty({ example: "Manager", type: String })
  @IsString()
  @IsNotEmpty({ message: "roleName is required" })
  roleName!: string;

  @ApiPropertyOptional({ example: "Manages operations", type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    type: [PermissionItemDto],
    description: "Module permissions (optional)",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionItemDto)
  permissions?: PermissionItemDto[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: "Manager", type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roleName?: string;

  @ApiPropertyOptional({ example: "Manages operations", type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    type: [PermissionItemDto],
    description: "Module permissions (optional)",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionItemDto)
  permissions?: PermissionItemDto[];
}

export class ChangeRoleStatusDto {
  @ApiProperty({ example: true, type: Boolean })
  @IsBoolean({ message: "status must be a boolean" })
  status!: boolean;
}

export class AssignPermissionsDto {
  @ApiProperty({
    type: [PermissionItemDto],
    description: "List of module permissions",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionItemDto)
  permissions!: PermissionItemDto[];
}

export class RolePaginationDto {
  @ApiPropertyOptional({ example: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, type: Number })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ example: "Manager", type: String })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "roleName",
    enum: ["id", "roleName", "createdAt", "updatedAt"],
  })
  @IsOptional()
  @IsIn(["id", "roleName", "createdAt", "updatedAt"])
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ example: "DESC", enum: ["ASC", "DESC"] })
  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";
}
