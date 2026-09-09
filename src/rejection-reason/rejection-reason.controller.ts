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
import { RejectionReasonService } from "./rejection-reason.service";
import {
  CreateRejectionReasonDto,
  UpdateRejectionReasonDto,
  RejectionReasonQueryDto,
} from "./dto/rejection-reason.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("rejection-reasons")
@ApiBearerAuth("JWT-auth")
@Controller(["rejection-reasons", "web-admin/rejection-reasons"])
@UseGuards(JwtAuthGuard)
export class RejectionReasonController {
  constructor(
    @Inject(RejectionReasonService)
    private readonly service: RejectionReasonService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create rejection reason (admin)" })
  @ApiBody({ type: CreateRejectionReasonDto })
  @ApiResponse({ status: 201, description: "Rejection reason created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  create(@Body() dto: CreateRejectionReasonDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: "List all rejection reasons" })
  @ApiQuery({
    name: "isActive",
    required: false,
    type: Boolean,
    description: "Filter by active status",
  })
  @ApiResponse({ status: 200, description: "List of rejection reasons" })
  findAll(@Query("isActive") isActive?: string) {
    const active =
      isActive === "true" ? true : isActive === "false" ? false : undefined;
    return this.service.findAll(active);
  }

  @Get("pagination")
  @ApiOperation({ summary: "Paginated rejection reasons with search & sort" })
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
  @ApiResponse({ status: 200, description: "Paginated rejection reasons list" })
  findPaginated(@Query() query: RejectionReasonQueryDto) {
    return this.service.findPaginated(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get rejection reason by ID" })
  @ApiParam({ name: "id", description: "Rejection reason UUID" })
  @ApiResponse({ status: 200, description: "Rejection reason found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update rejection reason (admin)" })
  @ApiParam({ name: "id", description: "Rejection reason UUID" })
  @ApiBody({ type: UpdateRejectionReasonDto })
  @ApiResponse({ status: 200, description: "Rejection reason updated" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRejectionReasonDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete rejection reason (admin)" })
  @ApiParam({ name: "id", description: "Rejection reason UUID" })
  @ApiResponse({ status: 200, description: "Rejection reason deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
