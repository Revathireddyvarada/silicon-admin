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
import { ModelsService } from "./models.service";
import { CreateModelDto } from "./dto/create-model.dto";
import { UpdateModelDto } from "./dto/update-model.dto";
import { FindAllQueryDto } from "./dto/find-all-query.dto";
import { Roles } from "../decorators/roles.decorator";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../decorators/current-user.decorator";
import { UserType } from "../entities/user.entity";
import { Public } from "../decorators/public.decorator";

@ApiTags("models")
@ApiBearerAuth("JWT-auth")
@Controller(["models", "web-admin/models"])
export class ModelsController {
  constructor(private service: ModelsService) {}

  // ── Get all — MUST be before :id ───────────────
  @Public()
  @Get("all")
  @ApiOperation({ summary: "Get active models by brand for dropdown" })
  @ApiQuery({ name: "brand_id", required: true, type: String })
  @ApiResponse({ status: 200, description: "Active models list" })
  getAllActive(@Query("brand_id") brandId: string) {
    return this.service.getAllActiveModels(brandId);
  }

  // ── Create ─────────────────────────────────────────────

  @Post()
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create model (admin)" })
  @ApiBody({ type: CreateModelDto })
  @ApiResponse({ status: 201, description: "Model created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 409, description: "Model already exists" })
  create(
    @Body() dto: CreateModelDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.create(dto, currentUser.id);
  }

  // ── List ───────────────────────────────────────────────
  @Get()
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "List models" })
  @ApiQuery({ name: "status", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiQuery({ name: "search", required: false, type: String, example: "Ciaz" })
  @ApiResponse({ status: 200, description: "List of models" })
  findAll(@Query() query: FindAllQueryDto) {
    return this.service.findAll(query);
  }
  @Get("brand/:brandId")
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "List models by brand" })
  @ApiParam({ name: "brandId", description: "Brand UUID" })
  @ApiQuery({ name: "status", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiQuery({ name: "search", required: false, type: String, example: "Ciaz" })
  @ApiResponse({ status: 200, description: "List of models for brand" })
  findByBrand(
    @Param("brandId", ParseUUIDPipe) brandId: string,
    @Query() query: FindAllQueryDto,
  ) {
    return this.service.findByBrand(brandId, query);
  }

  // ── Get by ID ──────────────────────────────────────────
  @Get(":id")
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "Get model by ID" })
  @ApiParam({ name: "id", description: "Model UUID" })
  @ApiResponse({ status: 200, description: "Model found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ── Update ─────────────────────────────────────────────

  @Patch(":id")
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "Update model (admin)" })
  @ApiParam({ name: "id", description: "Model UUID" })
  @ApiBody({ type: UpdateModelDto })
  @ApiResponse({ status: 200, description: "Model updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateModelDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, currentUser.id);
  }

  // ── Delete ─────────────────────────────────────────────

  @Delete(":id")
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN)
  @ApiOperation({ summary: "Delete model (admin)" })
  @ApiParam({ name: "id", description: "Model UUID" })
  @ApiResponse({ status: 200, description: "Model deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
