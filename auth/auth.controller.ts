import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { FindEmailDto } from './dto/find.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto, ResetPasswordDto, ForgotPasswordDto } from './dto/Password.dto';
import { ProfileResponseDto } from './dto/get-profile.dto.ts';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';


@ApiTags('auth')
@Controller(['auth', 'web-admin/auth'])
export class AuthController {
  constructor(private authService: AuthService) { }



  @Public()
  @Post('find-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find user by email' })
  @ApiBody({ type: FindEmailDto })
  @ApiResponse({ status: 200, description: 'User found', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'No user found with that email' })
  async findByEmail(@Body() dto: FindEmailDto) {
    return this.authService.findByEmail(dto);
  }


  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
  ) {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = req.ip ?? forwarded?.split(',')[0]?.trim();
    return this.authService.login(dto, ip);
  }

  // ── Refresh — open route ───────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  // ── Logout — authenticated ─────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout — blocklists access token, deletes session' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(
    @CurrentUser() user: { id: string; jti: string; exp: number },
  ) {
    const accessExpiresAt = new Date(user.exp * 1000);
    return this.authService.logout(user.jti, accessExpiresAt, user.id);
  }

  // ── Me — get current user ──────────────────────────────

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }

  @Get(':id/profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiOkResponse({ type: ProfileResponseDto, description: 'User profile fetched successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getProfile(@Param('id') id: string): Promise<ProfileResponseDto> {
    return this.authService.getProfile(id);
  }

  @Patch(':id/profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user profile by ID' })
  @ApiOkResponse({ type: ProfileResponseDto, description: 'User profile updated successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.authService.updateProfile(id, dto);
  }

  @Patch(':id/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change user password' })
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(id, dto);
  }

  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }


  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset Password' })
  @ApiQuery({ name: 'token', required: true })
  async resetPassword(
    @Query('token') token: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(token, dto);
  }
}