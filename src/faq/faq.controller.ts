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
import { FaqService } from "./faq.service";
import { CreateFaqDto, UpdateFaqDto, FaqQueryDto } from "./dto/faq.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { Public } from "../decorators/public.decorator";

@ApiTags("faq")
@ApiBearerAuth("JWT-auth")
@Controller(["faqs", "web-admin/faqs"])
// @UseGuards(JwtAuthGuard)
export class FaqController {
  constructor(@Inject(FaqService) private readonly service: FaqService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List all FAQs" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({
    name: "userType",
    required: false,
    enum: ["customer", "driver", "vendor"],
  })
  @ApiResponse({ status: 200, description: "List of FAQs" })
  findAll(
    @Query("isActive") isActive?: string,
    @Query("userType") userType?: string,
  ) {
    const active =
      isActive === "true" ? true : isActive === "false" ? false : undefined;
    return this.service.findAll(active, userType);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create FAQ (admin)" })
  @ApiBody({ type: CreateFaqDto })
  @ApiResponse({ status: 201, description: "FAQ created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  create(@Body() dto: CreateFaqDto) {
    return this.service.create(dto);
  }

  @Get("pagination")
  @ApiOperation({ summary: "Get paginated FAQs with search & sort" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["id", "questionName", "answer", "createdAt", "updatedAt"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiQuery({
    name: "userType",
    required: false,
    enum: ["customer", "driver", "vendor"],
  })
  @ApiResponse({ status: 200, description: "Paginated FAQ list" })
  findPaginated(@Query() query: FaqQueryDto) {
    return this.service.findPaginated(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get FAQ by ID" })
  @ApiParam({ name: "id", description: "FAQ UUID" })
  @ApiResponse({ status: 200, description: "FAQ found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update FAQ (admin)" })
  @ApiParam({ name: "id", description: "FAQ UUID" })
  @ApiBody({ type: UpdateFaqDto })
  @ApiResponse({ status: 200, description: "FAQ updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateFaqDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete FAQ (admin)" })
  @ApiParam({ name: "id", description: "FAQ UUID" })
  @ApiResponse({ status: 200, description: "FAQ deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
