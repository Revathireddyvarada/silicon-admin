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
import { SmsGatewaySettingsService } from "./sms-gateway-settings.service";
import { UpsertSmsGatewaySettingsDto } from "./dto/sms-gateway-settings.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("sms-gateway-settings")
@ApiBearerAuth("JWT-auth")
@Controller(["sms-gateway-settings", "web-admin/sms-gateway-settings"])
@UseGuards(JwtAuthGuard)
export class SmsGatewaySettingsController {
  constructor(
    @Inject(SmsGatewaySettingsService)
    private readonly service: SmsGatewaySettingsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create or Update SMS gateway settings (upsert)" })
  @ApiBody({ type: UpsertSmsGatewaySettingsDto })
  @ApiResponse({ status: 200, description: "SMS gateway settings saved" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  upsert(@Body() dto: UpsertSmsGatewaySettingsDto) {
    return this.service.upsert(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get SMS gateway settings" })
  @ApiResponse({ status: 200, description: "SMS gateway settings found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne() {
    return this.service.findOne();
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete SMS gateway settings (admin)" })
  @ApiResponse({ status: 200, description: "SMS gateway settings deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove() {
    return this.service.remove();
  }
}
