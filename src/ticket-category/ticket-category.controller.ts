import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { TicketCategoryService } from "./ticket-category.service";
import {
  CreateTicketCategoryDto,
  UpdateTicketCategoryDto,
} from "./dto/ticket-category.dto";
import { Public } from "../decorators/public.decorator";

@ApiTags("ticket-category")
@Controller(["ticket-categories", "web-admin/ticket-categories"])
export class TicketCategoryController {
  constructor(private readonly service: TicketCategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create ticket category" })
  @ApiResponse({ status: 201, description: "Category created" })
  create(@Body() dto: CreateTicketCategoryDto) {
    return this.service.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "Get all ticket categories" })
  @ApiResponse({ status: 200, description: "List of categories" })
  findAll() {
    return this.service.findAll();
  }

  /** Public read — used by ticket services to resolve category names. */
  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get ticket category by ID" })
  @ApiParam({ name: "id", description: "Category UUID" })
  @ApiResponse({ status: 200, description: "Category detail" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update ticket category" })
  @ApiParam({ name: "id", description: "Category UUID" })
  @ApiResponse({ status: 200, description: "Category updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(@Param("id") id: string, @Body() dto: UpdateTicketCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete ticket category (soft delete)" })
  @ApiParam({ name: "id", description: "Category UUID" })
  @ApiResponse({ status: 200, description: "Category deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
