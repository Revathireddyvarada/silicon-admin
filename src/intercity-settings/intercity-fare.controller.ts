import {
  Controller,
  Get,
  Post,
  Body,
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
import { InterCityFareService } from "./intercity-fare.service";
import {
  BulkUpsertB2cKmFareDto,
  UpsertInterCityTripSettingsDto,
} from "./dto/intercity-fare.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("intercity-fare-settings")
// @ApiBearerAuth("JWT-auth")
@Controller(["intercity-fare-settings", "web-admin/intercity-fare-settings"])
// @UseGuards(JwtAuthGuard)
export class InterCityFareController {
  constructor(
    @Inject(InterCityFareService)
    private readonly service: InterCityFareService,
  ) {}

  @Post("km-fares")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Bulk upsert Intercity km fare settings (all rows)" })
  @ApiBody({ type: BulkUpsertB2cKmFareDto })
  @ApiResponse({ status: 200, description: "Intercity km fares saved" })
  upsertKmFares(@Body() dto: BulkUpsertB2cKmFareDto, @Request() req: any) {
    return this.service.upsertKmFares(dto, req.user?.id);
  }

  @Get("km-fares")
  @ApiOperation({ summary: "Get all Intercity km fare settings (grouped by km range)" })
  @ApiResponse({ status: 200, description: "Intercity km fares grouped by range" })
  findAllKmFares() {
    return this.service.findAllKmFares();
  }

  @Post("trip-settings")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Upsert Intercity trip settings (wait time, commission, night charge)" })
  @ApiBody({ type: UpsertInterCityTripSettingsDto })
  @ApiResponse({ status: 200, description: "Intercity trip settings saved" })
  upsertTripSettings(
    @Body() dto: UpsertInterCityTripSettingsDto,
    @Request() req: any,
  ) {
    return this.service.upsertTripSettings(dto, req.user?.id);
  }

  @Get("trip-settings")
  @ApiOperation({ summary: "Get Intercity trip settings" })
  @ApiResponse({ status: 200, description: "Intercity trip settings" })
  @ApiResponse({ status: 404, description: "Not found" })
  findTripSettings() {
    return this.service.findTripSettings();
  }
}