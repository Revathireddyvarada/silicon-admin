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
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { CancelReasonService } from "./cancel-reason.service";
import {
  CreateCancelReasonDto,
  UpdateCancelReasonDto,
  CancelReasonQueryDto,
} from "./dto/cancel-reason.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("cancel-reasons")
@ApiBearerAuth("JWT-auth")
@Controller(["cancel-reasons", "web-admin/cancel-reasons"])
@UseGuards(JwtAuthGuard)
export class CancelReasonController {
  constructor(
    @Inject(CancelReasonService)
    private readonly service: CancelReasonService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create cancel reason (admin)" })
  @ApiBody({ type: CreateCancelReasonDto })
  @ApiResponse({ status: 201, description: "Cancel reason created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  create(@Body() dto: CreateCancelReasonDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: "List all cancel reasons" })
  @ApiQuery({
    name: "isActive",
    required: false,
    type: Boolean,
    description: "Filter by active status",
  })
  @ApiResponse({ status: 200, description: "List of cancel reasons" })
  findAll(@Query("isActive") isActive?: string) {
    const active =
      isActive === "true" ? true : isActive === "false" ? false : undefined;
    return this.service.findAll(active);
  }

  @Get("pagination")
  @ApiOperation({ summary: "Paginated cancel reasons with search & sort" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search by reason",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["id", "reason", "isActive", "createdAt", "updatedAt"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Paginated cancel reasons list" })
  findPaginated(@Query() query: CancelReasonQueryDto) {
    return this.service.findPaginated(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get cancel reason by ID" })
  @ApiParam({ name: "id", description: "Cancel reason UUID" })
  @ApiResponse({ status: 200, description: "Cancel reason found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update cancel reason (admin)" })
  @ApiParam({ name: "id", description: "Cancel reason UUID" })
  @ApiBody({ type: UpdateCancelReasonDto })
  @ApiResponse({ status: 200, description: "Cancel reason updated" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCancelReasonDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete cancel reason (admin)" })
  @ApiParam({ name: "id", description: "Cancel reason UUID" })
  @ApiResponse({ status: 200, description: "Cancel reason deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
