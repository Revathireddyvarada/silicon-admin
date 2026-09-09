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
  UseGuards,
  ParseUUIDPipe,
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
import { CmsService } from "./cms.service";
import { CreateCmsDto, UpdateCmsDto, CmsQueryDto } from "./dto/cms.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("cms")
@ApiBearerAuth("JWT-auth")
@Controller(["cms", "web-admin/cms"])
@UseGuards(JwtAuthGuard)
export class CmsController {
  constructor(@Inject(CmsService) private readonly service: CmsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create CMS page (admin)" })
  @ApiBody({ type: CreateCmsDto })
  @ApiResponse({ status: 201, description: "CMS created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  create(@Body() dto: CreateCmsDto) {
    return this.service.create(dto);
  }

  @Get("pagination")
  @ApiOperation({ summary: "Get paginated CMS pages with search & sort" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search by title or description",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["title", "urlIndex", "createdAt"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({ status: 200, description: "Paginated CMS list" })
  findPaginated(@Query() query: CmsQueryDto) {
    return this.service.findPaginated(query);
  }

  @Patch("/:id")
  @ApiOperation({ summary: "Update CMS page (admin)" })
  @ApiParam({ name: "id", description: "CMS UUID" })
  @ApiBody({ type: UpdateCmsDto })
  @ApiResponse({ status: 200, description: "CMS updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCmsDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft delete CMS page (admin)" })
  @ApiParam({ name: "id", description: "CMS UUID" })
  @ApiResponse({ status: 200, description: "CMS deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Get()
  @ApiOperation({ summary: "List all CMS pages" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({
    name: "urlIndex",
    required: false,
    type: String,
    description: "Filter by urlIndex e.g. privacy-policy",
  })
  @ApiResponse({ status: 200, description: "List of CMS pages" })
  findAll(
    @Query("isActive") isActive?: string,
    @Query("urlIndex") urlIndex?: string,
  ) {
    const active =
      isActive === "true" ? true : isActive === "false" ? false : undefined;
    return this.service.findAll(active, urlIndex);
  }

  @Get("/:id")
  @ApiOperation({
    summary: "Get CMS page by UUID or urlIndex e.g. privacy-policy",
  })
  @ApiParam({
    name: "id",
    description: "CMS UUID or urlIndex e.g. privacy-policy",
  })
  @ApiResponse({ status: 200, description: "CMS found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id") id: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    return isUuid ? this.service.findOne(id) : this.service.findByUrlIndex(id);
  }
}
