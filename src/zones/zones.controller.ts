import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ZonesService } from "./zones.service";
import { CreateZoneDto } from "./dto/create-zone.dto";
import { UpdateZoneDto } from "./dto/update-zone.dto";
import { FindAllZonesQueryDto } from "./dto/find-all-zones-query.dto";
import { Roles } from "../decorators/roles.decorator";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../decorators/current-user.decorator";
import { UserType } from "../entities/user.entity";

@ApiTags("web-admin")
@ApiBearerAuth("JWT-auth")
@Controller("web-admin/zones")
export class ZonesController {
  constructor(private readonly service: ZonesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "Create zone with drawn polygon" })
  @ApiBody({ type: CreateZoneDto })
  @ApiResponse({ status: 201, description: "Zone created" })
  create(
    @Body() dto: CreateZoneDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.create(dto, currentUser.id);
  }

  @Get()
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "List zones" })
  @ApiQuery({ name: "status", required: false, type: Boolean })
  @ApiQuery({ name: "state_id", required: false, type: String })
  @ApiQuery({ name: "city_id", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  findAll(@Query() query: FindAllZonesQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "Get zone by ID" })
  @ApiParam({ name: "id", description: "Zone UUID" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "Update zone" })
  @ApiParam({ name: "id", description: "Zone UUID" })
  @ApiBody({ type: UpdateZoneDto })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateZoneDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, currentUser.id);
  }

  @Delete(":id")
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN)
  @ApiOperation({ summary: "Soft-delete zone" })
  @ApiParam({ name: "id", description: "Zone UUID" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
