import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { RoleService } from "./role.service";
import {
  CreateRoleDto,
  UpdateRoleDto,
  ChangeRoleStatusDto,
  AssignPermissionsDto,
  RolePaginationDto,
} from "./dto/role.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("roles")
@ApiBearerAuth("JWT-auth")
@Controller(["roles", "web-admin/roles"])
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(
    @Inject(RoleService)
    private readonly service: RoleService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create role" })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: "Role created" })
  @ApiResponse({ status: 409, description: "Role name already exists" })
  create(@Body() dto: CreateRoleDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all roles (no pagination)" })
  @ApiResponse({ status: 200, description: "List of roles" })
  findAll() {
    return this.service.findAll();
  }

  @Get("pagination")
  @ApiOperation({ summary: "Get roles with pagination + search + sort" })
  @ApiResponse({ status: 200, description: "Paginated roles" })
  findPaginated(@Query() query: RolePaginationDto) {
    return this.service.findPaginated(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get role by ID (with permissions)" })
  @ApiParam({ name: "id", description: "Role UUID" })
  @ApiResponse({ status: 200, description: "Role with permissions" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update role" })
  @ApiParam({ name: "id", description: "Role UUID" })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: "Role updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Change role status (active/inactive)" })
  @ApiParam({ name: "id", description: "Role UUID" })
  @ApiBody({ type: ChangeRoleStatusDto })
  @ApiResponse({ status: 200, description: "Status updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleStatusDto,
    @Request() req: any,
  ) {
    return this.service.changeStatus(id, dto, req.user?.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete role" })
  @ApiParam({ name: "id", description: "Role UUID" })
  @ApiResponse({ status: 200, description: "Role deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }

  @Post(":id/permissions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Assign permissions to role (upsert)" })
  @ApiParam({ name: "id", description: "Role UUID" })
  @ApiBody({ type: AssignPermissionsDto })
  @ApiResponse({ status: 200, description: "Permissions assigned" })
  @ApiResponse({ status: 404, description: "Role not found" })
  assignPermissions(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AssignPermissionsDto,
    @Request() req: any,
  ) {
    return this.service.assignPermissions(id, dto, req.user?.id);
  }
}
