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
} from "@nestjs/swagger";
import { StaffService } from "./staff.service";
import {
  CreateStaffDto,
  UpdateStaffDto,
  ChangeStaffStatusDto,
  StaffPaginationDto,
} from "./dto/staff.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { Public } from "../decorators/public.decorator";

@ApiTags("staff")
@ApiBearerAuth("JWT-auth")
@Controller(["staff", "web-admin/staff"])
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(
    @Inject(StaffService)
    private readonly service: StaffService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create staff member" })
  @ApiBody({ type: CreateStaffDto })
  @ApiResponse({ status: 201, description: "Staff created" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  create(@Body() dto: CreateStaffDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }
  @Get()
  @ApiOperation({ summary: "Get all staff (no pagination)" })
  @ApiResponse({ status: 200, description: "List of staff" })
  findAll() {
    return this.service.findAll();
  }

  @Get("pagination")
  @ApiOperation({ summary: "Get staff with pagination + search + sort" })
  @ApiResponse({ status: 200, description: "Paginated staff list" })
  findPaginated(@Query() query: StaffPaginationDto) {
    return this.service.findPaginated(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get staff by ID" })
  @ApiParam({ name: "id", description: "Staff UUID" })
  @ApiResponse({ status: 200, description: "Staff details" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
  @Get("by-id/:id")
  @Public()
  @ApiOperation({ summary: "Get any user by ID (admin/staff/super-admin)" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "User details" })
  @ApiResponse({ status: 404, description: "Not found" })
  findByIdAny(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findByIdAny(id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Change staff status (active/inactive)" })
  @ApiParam({ name: "id", description: "Staff UUID" })
  @ApiBody({ type: ChangeStaffStatusDto })
  @ApiResponse({ status: 200, description: "Status updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeStaffStatusDto,
    @Request() req: any,
  ) {
    return this.service.changeStatus(id, dto, req.user?.id);
  }
  @Patch(":id/assign")
  @ApiOperation({ summary: "Update staff member" })
  @ApiParam({ name: "id", description: "Staff UUID" })
  @ApiBody({ type: UpdateStaffDto })
  @ApiResponse({ status: 200, description: "Staff updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  assign(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }
  @Patch(":id")
  @ApiOperation({ summary: "Update staff member" })
  @ApiParam({ name: "id", description: "Staff UUID" })
  @ApiBody({ type: UpdateStaffDto })
  @ApiResponse({ status: 200, description: "Staff updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Get("internal/admin-ids")
  @Public()
  @ApiOperation({ summary: "Internal: get active admin/super-admin ids" })
  @ApiResponse({
    status: 200,
    description: "List of active admin/super-admin ids",
  })
  findAllAdminIds() {
    return this.service.findAllAdminIds();
  }


  @Get("internal/admin-emails")
@Public()
@ApiOperation({
  summary: "Internal: get emails of active super-admins (user_type = 1, is_deleted = false)",
})
@ApiResponse({
  status: 200,
  description: "List of { id, email } for active super-admins",
})
findAllAdminEmails() {
  return this.service.findAllAdminEmails();
}

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete staff member" })
  @ApiParam({ name: "id", description: "Staff UUID" })
  @ApiResponse({ status: 200, description: "Staff deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
