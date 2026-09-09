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
import { B2cFareService } from "./b2c-fare.service";
import {
  BulkUpsertB2cKmFareDto,
  UpsertB2cTripSettingsDto,
} from "./dto/b2c-fare.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("b2c-fare-settings")
// @ApiBearerAuth("JWT-auth")
@Controller(["b2c-fare-settings", "web-admin/b2c-fare-settings"])
// @UseGuards(JwtAuthGuard)
export class B2cFareController {
  constructor(
    @Inject(B2cFareService)
    private readonly service: B2cFareService,
  ) {}

  @Post("km-fares")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Bulk upsert B2C km fare settings (all rows)" })
  @ApiBody({ type: BulkUpsertB2cKmFareDto })
  @ApiResponse({ status: 200, description: "B2C km fares saved" })
  upsertKmFares(@Body() dto: BulkUpsertB2cKmFareDto, @Request() req: any) {
    return this.service.upsertKmFares(dto, req.user?.id);
  }

  @Get("km-fares")
  @ApiOperation({
    summary: "Get all B2C km fare settings (grouped by km range)",
  })
  @ApiResponse({ status: 200, description: "B2C km fares grouped by range" })
  findAllKmFares() {
    return this.service.findAllKmFares();
  }

  @Post("trip-settings")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Upsert B2C trip settings (wait time, commission, night charge)",
  })
  @ApiBody({ type: UpsertB2cTripSettingsDto })
  @ApiResponse({ status: 200, description: "B2C trip settings saved" })
  upsertTripSettings(
    @Body() dto: UpsertB2cTripSettingsDto,
    @Request() req: any,
  ) {
    return this.service.upsertTripSettings(dto, req.user?.id);
  }

  @Get("trip-settings")
  @ApiOperation({ summary: "Get B2C trip settings" })
  @ApiResponse({ status: 200, description: "B2C trip settings" })
  @ApiResponse({ status: 404, description: "Not found" })
  findTripSettings() {
    return this.service.findTripSettings();
  }
}
