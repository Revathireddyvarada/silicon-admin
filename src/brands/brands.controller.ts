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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { Roles } from '../decorators/roles.decorator';

import { CurrentUser, CurrentUserPayload } from '../decorators/current-user.decorator';
import { UserType } from '../entities/user.entity';
import { Public } from '../decorators/public.decorator';

@ApiTags('brands')
@ApiBearerAuth('JWT-auth')
@Controller(['brands', 'web-admin/brands'])
export class BrandsController {
  constructor(private service: BrandsService) {}

  // ── Get all — MUST be before :id ───────────────
  // Public dropdown for mobile-driver / vendor apps (JWT still preferred on mobile-driver proxy).
  @Public()
  @Get('all')
  @ApiOperation({ summary: 'Get all active brands for dropdown' })
  @ApiResponse({ status: 200, description: 'Active brands list' })
  getAllActive() {
    return this.service.getAllActiveBrands();
  }

  // ── Create ─────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Create brand' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({ status: 201, description: 'Brand created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Already exists' })
  create(
    @Body() dto              : CreateBrandDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.create(dto, currentUser.id);
  }

  // ── List ───────────────────────────────────────────────

  @Get()
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'List brands' })
  @ApiQuery({ name: 'status', required: false, type: Boolean })
  @ApiQuery({ name: 'page',   required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit',  required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Suzuki' })
  @ApiResponse({ status: 200, description: 'List of brands' })
  findAll(@Query() query: FindAllQueryDto) {
    return this.service.findAll(query);
  }

  // ── Get by ID ──────────────────────────────────────────
  @Get(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Get brand by ID' })
  @ApiParam({ name: 'id', description: 'Brand UUID' })
  @ApiResponse({ status: 200, description: 'Brand found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ── Update ─────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Update brand' })
  @ApiParam({ name: 'id', description: 'Brand UUID' })
  @ApiBody({ type: UpdateBrandDto })
  @ApiResponse({ status: 200, description: 'Brand updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto                   : UpdateBrandDto,
    @CurrentUser() currentUser    : CurrentUserPayload,
  ) {
    return this.service.update(id, dto, currentUser.id);
  }

  // ── Delete ─────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN)
  @ApiOperation({ summary: 'Delete brand' })
  @ApiParam({ name: 'id', description: 'Brand UUID' })
  @ApiResponse({ status: 200, description: 'Brand deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}