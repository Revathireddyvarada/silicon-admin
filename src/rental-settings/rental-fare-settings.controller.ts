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
  Inject,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { RentalFareService } from "./rental-fare-settings.service";
import {
  CreateRentalPackageDto,
  UpdateRentalPackageDto,
  BulkUpsertRentalFareDto,
  UpsertRentalTripSettingsDto,
} from "./dto/rental-fare-settings.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("rental-fare-settings")
@ApiBearerAuth("JWT-auth")
@Controller(["rental-fare-settings", "web-admin/rental-fare-settings"])
@UseGuards(JwtAuthGuard)
export class RentalFareController {
  constructor(
    @Inject(RentalFareService)
    private readonly service: RentalFareService,
  ) {}

  @Post("packages")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create rental package (hours + included km)" })
  @ApiBody({ type: CreateRentalPackageDto })
  @ApiResponse({ status: 201, description: "Rental package created" })
  createPackage(@Body() dto: CreateRentalPackageDto, @Request() req: any) {
    return this.service.createPackage(dto, req.user?.id);
  }

  @Get("packages")
  @ApiOperation({ summary: "Get all rental packages" })
  @ApiResponse({ status: 200, description: "List of rental packages" })
  findAllPackages() {
    return this.service.findAllPackages();
  }

  @Patch("packages/:id")
  @ApiOperation({ summary: "Update rental package (includedKm, isActive)" })
  @ApiParam({ name: "id", description: "Rental package UUID" })
  @ApiBody({ type: UpdateRentalPackageDto })
  @ApiResponse({ status: 200, description: "Rental package updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  updatePackage(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRentalPackageDto,
    @Request() req: any,
  ) {
    return this.service.updatePackage(id, dto, req.user?.id);
  }

  @Delete("packages/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete rental package" })
  @ApiParam({ name: "id", description: "Rental package UUID" })
  @ApiResponse({ status: 200, description: "Rental package deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  removePackage(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.removePackage(id, req.user?.id);
  }

  @Post("fares")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Bulk upsert rental fares (mini, sedan, suv)" })
  @ApiBody({ type: BulkUpsertRentalFareDto })
  @ApiResponse({ status: 200, description: "Rental fares saved" })
  upsertFares(@Body() dto: BulkUpsertRentalFareDto, @Request() req: any) {
    return this.service.upsertFares(dto, req.user?.id);
  }

  @Get("fares")
  @ApiOperation({ summary: "Get all rental fare settings" })
  @ApiResponse({ status: 200, description: "Rental fares by vehicle type" })
  findAllFares() {
    return this.service.findAllFares();
  }

  @Post("trip-settings")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Upsert rental trip settings" })
  @ApiBody({ type: UpsertRentalTripSettingsDto })
  @ApiResponse({ status: 200, description: "Rental trip settings saved" })
  upsertTripSettings(
    @Body() dto: UpsertRentalTripSettingsDto,
    @Request() req: any,
  ) {
    return this.service.upsertTripSettings(dto, req.user?.id);
  }

  @Get("trip-settings")
  @ApiOperation({ summary: "Get rental trip settings" })
  @ApiResponse({ status: 200, description: "Rental trip settings" })
  @ApiResponse({ status: 404, description: "Not found" })
  findTripSettings() {
    return this.service.findTripSettings();
  }
}
