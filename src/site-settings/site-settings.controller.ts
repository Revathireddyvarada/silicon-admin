import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { SiteSettingsService } from "./site-settings.service";
import { UpsertSiteSettingsDto } from "./dto/site-settings.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("site-settings")
@ApiBearerAuth("JWT-auth")
@Controller(["site-settings", "web-admin/site-settings"])
@UseGuards(JwtAuthGuard)
export class SiteSettingsController {
  constructor(
    private readonly service: SiteSettingsService,
  ) {}


  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create or Update site settings (upsert)" })
  @ApiBody({ type: UpsertSiteSettingsDto })
  @ApiResponse({ status: 200, description: "SiteSettings saved" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  upsert(@Body() dto: UpsertSiteSettingsDto, @Request() req: any) {
    return this.service.upsert(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: "Get site settings" })
  @ApiResponse({ status: 200, description: "SiteSettings found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne() {
    return this.service.findOne();
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete site settings (admin)" })
  @ApiResponse({ status: 200, description: "SiteSettings deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Request() req: any) {
    return this.service.remove(req.user?.id);
  }
}
