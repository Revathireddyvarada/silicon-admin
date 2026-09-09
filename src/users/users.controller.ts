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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../decorators/current-user.decorator';
import { UserType } from '../entities/user.entity';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller(['users', 'web-admin/users'])
// ← NO @UseGuards() — global guards handle it
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ── Create user — admin/staff only ────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)          // ← RolesGuard handles
  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(
    @Body() dto               : CreateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.createUser(dto, currentUser.id);
  }

  // ── List users — any authenticated user ───────────────

  @Get()
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  findAll() {
    return this.usersService.findAll();
  }

  // ── Get user by ID ─────────────────────────────────────

  @Get(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  // ── Update user — admin/staff only ────────────────────

  @Patch(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF)
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id', ParseUUIDPipe) id : string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.update(id, dto, currentUser.id);
  }

  // ── Delete user — admin only ───────────────────────────

  @Delete(':id')
  @Roles(UserType.SUPER_ADMIN, UserType.ADMIN)  // ← only admin can delete
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}