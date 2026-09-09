import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { B2bFareSettingsService } from "./b2b-fare-settings.service";
import { UpsertB2bFareSettingsDto } from "./dto/b2b-fare-settings.dto";
import { Public } from "../decorators/public.decorator";

@ApiTags("b2b-fare-settings")
@Controller(["b2b-fare-settings", "web-admin/b2b-fare-settings"])
export class B2bFareSettingsController {
  constructor(
    @Inject(B2bFareSettingsService)
    private readonly service: B2bFareSettingsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Upsert B2B fare settings (admin)" })
  @ApiBody({ type: UpsertB2bFareSettingsDto })
  @ApiResponse({ status: 200, description: "B2B fare settings saved" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  upsert(@Body() dto: UpsertB2bFareSettingsDto, @Request() req: any) {
    return this.service.upsert(dto, req.user?.id);
  }

  /** Public — ride-service reads this for trip create/import/completion fare breakup. */
  @Public()
  @Get()
  @ApiOperation({ summary: "Get B2B fare settings" })
  @ApiResponse({ status: 200, description: "B2B fare settings" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne() {
    return this.service.findOne();
  }
}