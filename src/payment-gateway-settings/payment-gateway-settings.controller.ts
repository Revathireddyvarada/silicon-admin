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
import { PaymentGatewaySettingsService } from "./payment-gateway-settings.service";
import { UpsertPaymentGatewaySettingsDto } from "./dto/payment-gateway-settings-dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("payment-gateway-settings")
@ApiBearerAuth("JWT-auth")
@Controller(["payment-gateway-settings", "web-admin/payment-gateway-settings"])
@UseGuards(JwtAuthGuard)
export class PaymentGatewaySettingsController {
  constructor(
    @Inject(PaymentGatewaySettingsService)
    private readonly service: PaymentGatewaySettingsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create or Update payment gateway settings (upsert)" })
  @ApiBody({ type: UpsertPaymentGatewaySettingsDto })
  @ApiResponse({ status: 200, description: "Payment gateway settings saved" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  upsert(@Body() dto: UpsertPaymentGatewaySettingsDto) {
    return this.service.upsert(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get payment gateway settings" })
  @ApiResponse({ status: 200, description: "Payment gateway settings found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne() {
    return this.service.findOne();
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete payment gateway settings (admin)" })
  @ApiResponse({ status: 200, description: "Payment gateway settings deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove() {
    return this.service.remove();
  }
}