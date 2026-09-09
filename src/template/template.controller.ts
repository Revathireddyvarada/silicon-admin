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
import { TemplateService } from "./template.service";
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQueryDto,
} from "./dto/template.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("template")
@ApiBearerAuth("JWT-auth")
@Controller(["template", "web-admin/template"])
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(
    @Inject(TemplateService) private readonly service: TemplateService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create template (admin)" })
  @ApiBody({ type: CreateTemplateDto })
  @ApiResponse({ status: 201, description: "Template created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  create(@Body() dto: CreateTemplateDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: "List all templates" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "deliveryMethod", required: false, enum: ["email", "sms"] })
  @ApiResponse({ status: 200, description: "List of templates" })
  findAll(
    @Query("isActive") isActive?: string,
    @Query("deliveryMethod") deliveryMethod?: string,
  ) {
    const active =
      isActive === "true" ? true : isActive === "false" ? false : undefined;
    return this.service.findAll(active, deliveryMethod);
  }

  @Get("pagination")
  @ApiOperation({ summary: "Get paginated templates with search & sort" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search by templateName or subject",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["templateName", "deliveryMethod", "createdAt", "updatedAt"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({ status: 200, description: "Paginated template list" })
  findPaginated(@Query() query: TemplateQueryDto) {
    return this.service.findPaginated(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get template by ID" })
  @ApiParam({ name: "id", description: "Template UUID" })
  @ApiResponse({ status: 200, description: "Template found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update template (admin)" })
  @ApiParam({ name: "id", description: "Template UUID" })
  @ApiBody({ type: UpdateTemplateDto })
  @ApiResponse({ status: 200, description: "Template updated" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft delete template (admin)" })
  @ApiParam({ name: "id", description: "Template UUID" })
  @ApiResponse({ status: 200, description: "Template deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
