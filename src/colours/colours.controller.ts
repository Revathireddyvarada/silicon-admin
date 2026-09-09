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
import { ColoursService } from './colours.service';
import { CreateColourDto } from './dto/create-colour.dto';
import { UpdateColourDto } from './dto/update-colours.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { Roles } from '../decorators/roles.decorator';

import { CurrentUser, CurrentUserPayload } from '../decorators/current-user.decorator';
import { UserType } from '../entities/user.entity';
import { Public } from '../decorators/public.decorator';

@ApiTags('colours')
@ApiBearerAuth('JWT-auth')
@Controller(['colours', 'web-admin/colours'])
export class ColoursController {
  constructor(private service: ColoursService) {}

  // ── Get all — MUST be before :id ───────────────
  @Public()
  @Get('all')
  @ApiOperation({ summary: 'Get all active colours for dropdown' })
  @ApiResponse({ status: 200, description: 'Active colours list' })
  getAllActive() {
    return this.service.getAllActiveColours();
  }

  // ── Create ─────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Create colour' })
  @ApiBody({ type: CreateColourDto })
  @ApiResponse({ status: 201, description: 'Colour created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Already exists' })
  create(
    @Body() dto              : CreateColourDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.create(dto, currentUser.id);
  }

  // ── List ───────────────────────────────────────────────

  @Get()
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'List colours' })
  @ApiQuery({ name: 'status', required: false, type: Boolean })
  @ApiQuery({ name: 'page',   required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit',  required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'red' })
  @ApiResponse({ status: 200, description: 'List of colours' })
  findAll(@Query() query: FindAllQueryDto) {
    return this.service.findAll(query);
  }

  // ── Get by ID ──────────────────────────────────────────
  @Get(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Get colour by ID' })
  @ApiParam({ name: 'id', description: 'Colour UUID' })
  @ApiResponse({ status: 200, description: 'Colour found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ── Update ─────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Update colour' })
  @ApiParam({ name: 'id', description: 'Colour UUID' })
  @ApiBody({ type: UpdateColourDto })
  @ApiResponse({ status: 200, description: 'Colour updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto                   : UpdateColourDto,
    @CurrentUser() currentUser    : CurrentUserPayload,
  ) {
    return this.service.update(id, dto, currentUser.id);
  }

  // ── Delete ─────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN)
  @ApiOperation({ summary: 'Delete colour' })
  @ApiParam({ name: 'id', description: 'Colour UUID' })
  @ApiResponse({ status: 200, description: 'Colour deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}