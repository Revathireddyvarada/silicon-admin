import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { SmtpSettingsService } from "./smtp-settings.service";
import { UpsertSmtpSettingsDto } from "./dto/smtp-settings.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("smtp-settings")
@ApiBearerAuth("JWT-auth")
@Controller(["smtp-settings", "web-admin/smtp-settings"])
@UseGuards(JwtAuthGuard)
export class SmtpSettingsController {
  constructor(
    @Inject(SmtpSettingsService) private readonly service: SmtpSettingsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create or Update SMTP settings (upsert)" })
  @ApiBody({ type: UpsertSmtpSettingsDto })
  @ApiResponse({ status: 200, description: "SMTP settings saved" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  upsert(@Body() dto: UpsertSmtpSettingsDto) {
    return this.service.upsert(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get SMTP settings" })
  @ApiResponse({ status: 200, description: "SMTP settings found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne() {
    return this.service.findOne();
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete SMTP settings (admin)" })
  @ApiResponse({ status: 200, description: "SMTP settings deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove() {
    return this.service.remove();
  }
}
