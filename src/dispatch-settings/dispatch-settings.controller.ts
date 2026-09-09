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
import { DispatchSettingsService } from "./dispatch-settings.service";
import { UpsertDispatchSettingsDto } from "./dto/dispatch-settings.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("dispatch-settings")
@Controller(["dispatch-settings", "web-admin/dispatch-settings"])
@UseGuards(JwtAuthGuard)
export class DispatchSettingsController {
  constructor(
    @Inject(DispatchSettingsService)
    private readonly service: DispatchSettingsService,
  ) {}

  @Post()
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create or Update dispatch settings (upsert)" })
  @ApiBody({ type: UpsertDispatchSettingsDto })
  @ApiResponse({ status: 200, description: "Dispatch settings saved" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  upsert(@Body() dto: UpsertDispatchSettingsDto) {
    return this.service.upsert(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get dispatch settings" })
  @ApiResponse({ status: 200, description: "Dispatch settings found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne() {
    return this.service.findOne();
  }

  @Delete()
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete dispatch settings (admin)" })
  @ApiResponse({ status: 200, description: "Dispatch settings deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove() {
    return this.service.remove();
  }
}
