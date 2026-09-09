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
import { StatesService } from "./states.service";
import { CreateStateDto } from "./dto/create-state.dto";
import { UpdateStateDto } from "./dto/update-state.dto";
import { FindAllQueryDto } from "./dto/find-all-query.dto";
import { Roles } from "../decorators/roles.decorator";

import {
  CurrentUser,
  CurrentUserPayload,
} from "../decorators/current-user.decorator";
import { UserType } from "../entities/user.entity";
import { Public } from "../decorators/public.decorator";

@ApiTags("states")
@ApiBearerAuth("JWT-auth")
@Controller(["states", "web-admin/states"])
export class StatesController {
  constructor(private service: StatesService) {}

  @Public()
  @Get("all")
  @ApiOperation({ summary: "Get all active states for dropdown" })
  @ApiResponse({ status: 200, description: "Active states list" })
  getAllActive() {
    return this.service.getAllActiveStates();
  }

  @Public()
  @Get("all-with-cities")
  @ApiOperation({
    summary: "Get all active states with nested active cities, for dropdown",
  })
  @ApiResponse({ status: 200, description: "States with nested cities list" })
  getAllActiveWithCities() {
    return this.service.getAllActiveStatesWithCities();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "Create state" })
  @ApiBody({ type: CreateStateDto })
  @ApiResponse({ status: 201, description: "State created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 409, description: "Already exists" })
  create(
    @Body() dto: CreateStateDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.create(dto, currentUser.id);
  }

  @Get()
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "List states" })
  @ApiQuery({ name: "status", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    example: "Tamil Nadu",
  })
  @ApiResponse({ status: 200, description: "List of states" })
  findAll(@Query() query: FindAllQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "Get state by ID" })
  @ApiParam({ name: "id", description: "State UUID" })
  @ApiResponse({ status: 200, description: "State found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: "Update state" })
  @ApiParam({ name: "id", description: "State UUID" })
  @ApiBody({ type: UpdateStateDto })
  @ApiResponse({ status: 200, description: "State updated" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 404, description: "Not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateStateDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, currentUser.id);
  }

  @Delete(":id")
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN)
  @ApiOperation({ summary: "Delete state" })
  @ApiParam({ name: "id", description: "State UUID" })
  @ApiResponse({ status: 200, description: "State deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
