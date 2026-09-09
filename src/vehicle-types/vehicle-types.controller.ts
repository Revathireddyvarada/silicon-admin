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
import { VehicleTypesService } from './vehicle-types.service';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';
import { UpdateVehicleTypeDto } from './dto/update-vehicle-type.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../decorators/current-user.decorator';
import { UserType } from '../entities/user.entity';
import { Public } from '../decorators/public.decorator';

@ApiTags('vehicle-types')
@ApiBearerAuth('JWT-auth')
@Controller(['vehicle-types', 'web-admin/vehicle-types'])
// ← NO @UseGuards() — global guards handle it
export class VehicleTypesController {
  constructor(private service: VehicleTypesService) {} // ← no @Inject()

  // ── Get all active — dropdown ──────────────────────────
  // ← MUST be before :id route to avoid conflict
  // Public so ride-service trip import can load seat capacity without JWT hop.
  @Public()
  @Get('all')                                       // ← was 'all', moved UP
  @ApiOperation({ summary: 'Get active vehicle types for dropdown' })
  @ApiResponse({ status: 200, description: 'Active vehicle types' })
  getAllActive() {
    return this.service.getAllActiveVehicleTypes();
  }

  // ── Create — admin/staff only ──────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Create vehicle type' })
  @ApiBody({ type: CreateVehicleTypeDto })
  @ApiResponse({ status: 201, description: 'Vehicle type created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Already exists' })
  create(
    @Body() dto              : CreateVehicleTypeDto,
    @CurrentUser() currentUser: CurrentUserPayload,   // ← typed
  ) {
    return this.service.create(dto, currentUser.id);
  }

  // ── List — with pagination ─────────────────────────────

  @Get()
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'List vehicle types' })
  @ApiQuery({ name: 'status', required: false, type: Boolean })
  @ApiQuery({ name: 'page',   required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit',  required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'List of vehicle types' })
  findAll(@Query() query: FindAllQueryDto) {
    return this.service.findAll(query);
  }

  // ── Get by ID ──────────────────────────────────────────
  @Get(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Get vehicle type by ID' })
  @ApiParam({ name: 'id', description: 'Vehicle type UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle type found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ── Update — admin/staff only ──────────────────────────

  @Patch(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Update vehicle type' })
  @ApiParam({ name: 'id', description: 'Vehicle type UUID' })
  @ApiBody({ type: UpdateVehicleTypeDto })
  @ApiResponse({ status: 200, description: 'Vehicle type updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto                   : UpdateVehicleTypeDto,
    @CurrentUser() currentUser    : CurrentUserPayload, // ← typed
  ) {
    return this.service.update(id, dto, currentUser.id);
  }

  // ── Delete — admin only ────────────────────────────────

  @Delete(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN)
  @ApiOperation({ summary: 'Delete vehicle type' })
  @ApiParam({ name: 'id', description: 'Vehicle type UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle type deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}