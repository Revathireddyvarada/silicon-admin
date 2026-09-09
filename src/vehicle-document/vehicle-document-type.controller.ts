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
import { VehicleDocumentTypeService } from "./vehicle-document-type.service";
import {
  CreateVehicleDocumentTypeDto,
  UpdateVehicleDocumentTypeDto,
} from "./dto/vehicle-document-type.dto";
import { Public } from "../decorators/public.decorator";

@ApiTags("vehicle-document-types")
@Controller(["vehicle-document-types", "web-admin/vehicle-document-types"])
export class VehicleDocumentTypeController {
  constructor(
    @Inject(VehicleDocumentTypeService)
    private readonly service: VehicleDocumentTypeService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create vehicle document type (admin)" })
  @ApiBody({ type: CreateVehicleDocumentTypeDto })
  @ApiResponse({ status: 201, description: "Vehicle document type created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  create(@Body() dto: CreateVehicleDocumentTypeDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "List all vehicle document types (flat)" })
  @ApiQuery({
    name: "grouped",
    required: false,
    type: Boolean,
    description: "If true, returns parents with children nested",
  })
  @ApiResponse({ status: 200, description: "List of vehicle document types" })
  findAll(@Query("grouped") grouped?: string) {
    if (grouped === "true") {
      return this.service.findAllGrouped();
    }
    return this.service.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get vehicle document type by ID" })
  @ApiParam({ name: "id", description: "Vehicle document type UUID" })
  @ApiResponse({ status: 200, description: "Vehicle document type found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary:
      "Update vehicle document type (admin). Returns updated parent + reconciled child rows.",
  })
  @ApiParam({ name: "id", description: "Vehicle document type UUID" })
  @ApiBody({ type: UpdateVehicleDocumentTypeDto })
  @ApiResponse({ status: 200, description: "Vehicle document type updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDocumentTypeDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Permanently delete vehicle document type + children (admin)" })
  @ApiParam({ name: "id", description: "Vehicle document type UUID" })
  @ApiResponse({ status: 200, description: "Vehicle document type deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}