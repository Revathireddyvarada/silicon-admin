import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { HelpCenterService } from "./help-center.service";
import {
  CreateHelpCenterDto,
  UpdateHelpCenterDto,
  HelpCenterQueryDto,
} from "./dto/help-center.dto";
import { Public } from "../decorators/public.decorator";

@Public()
@ApiTags("help-center")
@Controller(["help-center", "web-admin/help-center"])
export class HelpCenterController {
  constructor(
    @Inject(HelpCenterService) private readonly service: HelpCenterService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a HelpCenter entry" })
  @ApiBody({ type: CreateHelpCenterDto })
  @ApiResponse({ status: 201, description: "HelpCenter entry created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  create(@Body() dto: CreateHelpCenterDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List all HelpCenter entries" })
  @ApiQuery({
    name: "isActive",
    required: false,
    type: Boolean,
    description: "Filter by active status",
  })
  @ApiResponse({ status: 200, description: "List of HelpCenter entries" })
  findAll(@Query("isActive") isActive?: string) {
    const active =
      isActive === "true" ? true : isActive === "false" ? false : undefined;
    return this.service.findAll(active);
  }

  @Get("pagination")
  @ApiOperation({
    summary: "Get paginated HelpCenter entries with search & sort",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search by question or description",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["id", "questionName", "description", "createdAt", "updatedAt"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({ status: 200, description: "Paginated HelpCenter list" })
  findPaginated(@Query() query: HelpCenterQueryDto) {
    return this.service.findPaginated(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get HelpCenter entry by ID" })
  @ApiParam({ name: "id", description: "HelpCenter UUID" })
  @ApiResponse({ status: 200, description: "HelpCenter entry found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update HelpCenter entry" })
  @ApiParam({ name: "id", description: "HelpCenter UUID" })
  @ApiBody({ type: UpdateHelpCenterDto })
  @ApiResponse({ status: 200, description: "HelpCenter entry updated" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateHelpCenterDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete HelpCenter entry" })
  @ApiParam({ name: "id", description: "HelpCenter UUID" })
  @ApiResponse({ status: 200, description: "HelpCenter entry deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
