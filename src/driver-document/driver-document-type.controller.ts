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
  Inject,
  ParseUUIDPipe,
  Request,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { DriverDocumentTypeService } from "./driver-document-type.service";
import {
  CreateDriverDocumentTypeDto,
  UpdateDriverDocumentTypeDto,
} from "./dto/driver-document-type.dto";
import { Public } from "../decorators/public.decorator";

@ApiTags("driver-document-types")
@Controller(["driver-document-types", "web-admin/driver-document-types"])
export class DriverDocumentTypeController {
  constructor(
    @Inject(DriverDocumentTypeService)
    private readonly service: DriverDocumentTypeService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create driver document type (admin)" })
  @ApiBody({ type: CreateDriverDocumentTypeDto })
  @ApiResponse({ status: 201, description: "Driver document type created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  create(@Body() dto: CreateDriverDocumentTypeDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "List all driver document types (flat)" })
  @ApiQuery({
    name: "grouped",
    required: false,
    type: Boolean,
    description: "If true, returns parents with children nested",
  })
  @ApiResponse({ status: 200, description: "List of driver document types" })
  findAll(@Query("grouped") grouped?: string) {
    if (grouped === "true") {
      return this.service.findAllGrouped();
    }
    return this.service.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get driver document type by ID" })
  @ApiParam({ name: "id", description: "Driver document type UUID" })
  @ApiResponse({ status: 200, description: "Driver document type found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update driver document type (admin)" })
  @ApiParam({ name: "id", description: "Driver document type UUID" })
  @ApiBody({ type: UpdateDriverDocumentTypeDto })
  @ApiResponse({ status: 200, description: "Driver document type updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriverDocumentTypeDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete driver document type + children (admin)" })
  @ApiParam({ name: "id", description: "Driver document type UUID" })
  @ApiResponse({ status: 200, description: "Driver document type deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}