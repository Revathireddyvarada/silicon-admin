import {
  Controller,
  Get,
  Post,
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
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { ActivityLogService } from "./activity-log.service";
import { CreateActivityLogDto, ActivityLogQueryDto } from "./dto/activity-log.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("activity-log")
@ApiBearerAuth("JWT-auth")
@Controller(["activity-log", "web-admin/activity-log"])
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(
    @Inject(ActivityLogService)
    private readonly service: ActivityLogService,
  ) { }

  // POST /activity-log
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create an activity log entry" })
  @ApiBody({ type: CreateActivityLogDto })
  @ApiResponse({ status: 201, description: "Log entry created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  create(@Body() dto: CreateActivityLogDto, @Request() req: any) {
    return this.service.log(dto, req.user?.id);
  }

  // GET /activity-log?page=1&limit=10&search=...&modelName=...&fromDate=...&toDate=...
  @Get()
  @ApiOperation({ summary: "Get paginated activity logs with filters" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String, description: "Search in description" })
  @ApiQuery({ name: "modelName", required: false, type: String, description: "Filter by model (e.g. Trip, Driver)" })
  @ApiQuery({ name: "createdBy", required: false, type: String, description: "Filter by user UUID" })
  @ApiQuery({ name: "userType", required: false, type: String, description: "Filter by user type/role name" })
  @ApiQuery({ name: "fromDate", required: false, type: String, description: "Start date (ISO)" })
  @ApiQuery({ name: "toDate", required: false, type: String, description: "End date (ISO)" })
  @ApiQuery({ name: "sortBy", required: false, enum: ["createdAt", "action", "modelName"] })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({ status: 200, description: "Paginated activity log list" })
  findPaginated(@Query() query: ActivityLogQueryDto) {
    return this.service.findPaginated(query);
  }

  // GET /activity-log/:id
  @Get(":id")
  @ApiOperation({ summary: "Get a single activity log entry by ID" })
  @ApiParam({ name: "id", description: "Activity Log UUID" })
  @ApiResponse({ status: 200, description: "Log entry found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // DELETE /activity-log/:id
  @Delete(":id")
  @ApiOperation({ summary: "Soft delete an activity log entry" })
  @ApiParam({ name: "id", description: "Activity Log UUID" })
  @ApiResponse({ status: 200, description: "Log entry deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}