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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { Roles } from '../decorators/roles.decorator';

import { CurrentUser, CurrentUserPayload } from '../decorators/current-user.decorator';
import { UserType } from '../entities/user.entity';
import { Public } from '../decorators/public.decorator';

@ApiTags('cities')
@ApiBearerAuth('JWT-auth')
@Controller(['cities', 'web-admin/cities'])
// ← NO @UseGuards() — global guards handle it
export class CitiesController {
  constructor(private service: CitiesService) {}

  // ── Get all cities — dropdown ───────────────────────
  // ← MUST be before :id route
  @Public()
  @Get('all')
  @ApiOperation({ summary: 'Get active cities by state for dropdown' })
  @ApiQuery({ name: 'state_id', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Active cities list' })
  getAllActive(@Query('state_id') stateId?: string) {
    return this.service.getAllActiveCities(stateId ?? '');
  }

  // ── Create — admin/staff only ──────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Create city' })
  @ApiBody({ type: CreateCityDto })
  @ApiResponse({ status: 201, description: 'City created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @ApiResponse({ status: 409, description: 'Already exists' })
  create(
    @Body() dto              : CreateCityDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.create(dto, currentUser.id);
  }

  // ── List — with pagination ─────────────────────────────

  @Get()
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'List cities' })
  @ApiQuery({ name: 'status', required: false, type: Boolean })
  @ApiQuery({ name: 'page',   required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit',  required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Chennai' })
  @ApiResponse({ status: 200, description: 'List of cities' })
  findAll(@Query() query: FindAllQueryDto) {
    return this.service.findAll(query);
  }

  // ── Get by ID ──────────────────────────────────────────
  @Get(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Get city by ID' })
  @ApiParam({ name: 'id', description: 'City UUID' })
  @ApiResponse({ status: 200, description: 'City found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ── Update — admin/staff only ──────────────────────────

  @Patch(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Update city' })
  @ApiParam({ name: 'id', description: 'City UUID' })
  @ApiBody({ type: UpdateCityDto })
  @ApiResponse({ status: 200, description: 'City updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto                   : UpdateCityDto,
    @CurrentUser() currentUser    : CurrentUserPayload,
  ) {
    return this.service.update(id, dto, currentUser.id);
  }

  // ── Delete — admin only ────────────────────────────────

  @Delete(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN)
  @ApiOperation({ summary: 'Delete city' })
  @ApiParam({ name: 'id', description: 'City UUID' })
  @ApiResponse({ status: 200, description: 'City deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}