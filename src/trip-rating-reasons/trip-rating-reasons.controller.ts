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
import { TripRatingReasonsService } from './trip-rating-reasons.service';
import { CreateTripRatingReasonDto } from './dto/create-trip-rating-reason.dto';
import { UpdateTripRatingReasonDto } from './dto/update-trip-rating-reason.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { Roles } from '../decorators/roles.decorator';

import { CurrentUser, CurrentUserPayload } from '../decorators/current-user.decorator';
import { UserType } from '../entities/user.entity';
import { Public } from '../decorators/public.decorator';

@ApiTags('trip-rating-reasons')
@ApiBearerAuth('JWT-auth')
@Controller('trip-rating-reasons')
export class TripRatingReasonsController {
  constructor(private service: TripRatingReasonsService) {}

  // ── Get all — MUST be before :id ───────────────
  // Dropdown master: same as brands/states (no admin-only @Roles).
  // Prefer prefixed routes: /web-admin|web-vendor|mobile-vendor/.../trip-rating-reasons/all
  @Public()
  @Get('all')
  @ApiOperation({
    summary: 'Get all active trip rating reasons for dropdown',
    description:
      'Legacy unprefixed path. Prefer GET /web-admin/trip-rating-reasons/all, ' +
      'GET /web-vendor/trip-rating-reasons/all, or GET /mobile-vendor/trip-rating-reasons/all. ' +
      'Driver app: GET /api/driver-service/mobile-driver/trip-rating-reasons/all.',
  })
  @ApiResponse({ status: 200, description: 'Active trip rating reasons list' })
  getAllActive() {
    return this.service.getAllActive();
  }

  // ── Create ─────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Create trip rating reason' })
  @ApiBody({ type: CreateTripRatingReasonDto })
  @ApiResponse({ status: 201, description: 'Reason created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Already exists' })
  create(
    @Body() dto: CreateTripRatingReasonDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.create(dto, currentUser.id);
  }

  // ── List ───────────────────────────────────────────────

  @Get()
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'List trip rating reasons' })
  @ApiQuery({ name: 'status', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'late' })
  @ApiResponse({ status: 200, description: 'List of trip rating reasons' })
  findAll(@Query() query: FindAllQueryDto) {
    return this.service.findAll(query);
  }

  // ── Get by ID ──────────────────────────────────────────
  @Get(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Get trip rating reason by ID' })
  @ApiParam({ name: 'id', description: 'Reason UUID' })
  @ApiResponse({ status: 200, description: 'Reason found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ── Update ─────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Update trip rating reason' })
  @ApiParam({ name: 'id', description: 'Reason UUID' })
  @ApiBody({ type: UpdateTripRatingReasonDto })
  @ApiResponse({ status: 200, description: 'Reason updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripRatingReasonDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, currentUser.id);
  }

  // ── Delete ─────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN)
  @ApiOperation({ summary: 'Delete trip rating reason' })
  @ApiParam({ name: 'id', description: 'Reason UUID' })
  @ApiResponse({ status: 200, description: 'Reason deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
