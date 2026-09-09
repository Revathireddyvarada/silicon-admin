import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { StatesService } from "../states/states.service";
import { CitiesService } from "../cities/cities.service";
import { BrandsService } from "../brands/brands.service";
import { VehicleTypesService } from "../vehicle-types/vehicle-types.service";
import { TripRatingReasonsService } from "../trip-rating-reasons/trip-rating-reasons.service";
import { B2bFareSettingsService } from "../b2b-fare-settings/b2b-fare-settings.service";
import { S3Service } from "../s3/s3.service";
import { Public } from "../decorators/public.decorator";

/**
 * Read-only masters + S3 upload helpers for Vendor Web FE.
 * JWT required (global guard). No @Roles — vendor tokens are allowed.
 * Legacy admin-only paths keep @Roles(SUPER_ADMIN/ADMIN/STAFF).
 */
@ApiTags("web-vendor")
@ApiBearerAuth("JWT-auth")
@Controller("web-vendor")
export class WebVendorMastersController {
  constructor(
    private readonly statesService: StatesService,
    private readonly citiesService: CitiesService,
    private readonly brandsService: BrandsService,
    private readonly vehicleTypesService: VehicleTypesService,
    private readonly tripRatingReasonsService: TripRatingReasonsService,
    private readonly b2bFareSettingsService: B2bFareSettingsService,
    private readonly s3Service: S3Service,
  ) {}

  @Public()
  @Get("states/all")
  @ApiOperation({ summary: "Vendor web — active states dropdown" })
  @ApiResponse({ status: 200, description: "Active states list" })
  getStates() {
    return this.statesService.getAllActiveStates();
  }

  @Public()
  @Get("cities/all")
  @ApiOperation({ summary: "Vendor web — active cities dropdown" })
  @ApiQuery({ name: "state_id", required: false })
  @ApiResponse({ status: 200, description: "Active cities list" })
  getCities(@Query("state_id") stateId?: string) {
    return this.citiesService.getAllActiveCities(stateId ?? "");
  }

  @Get("brands/all")
  @ApiOperation({ summary: "Vendor web — active brands dropdown (JWT)" })
  @ApiResponse({ status: 200, description: "Active brands list" })
  getBrands() {
    return this.brandsService.getAllActiveBrands();
  }

  @Get("vehicle-types/all")
  @ApiOperation({ summary: "Vendor web — active vehicle types (JWT)" })
  @ApiResponse({ status: 200, description: "Active vehicle types list" })
  getVehicleTypes() {
    return this.vehicleTypesService.getAllActiveVehicleTypes();
  }

  @Get("trip-rating-reasons/all")
  @ApiOperation({ summary: "Vendor web — active trip rating reasons (JWT)" })
  @ApiResponse({ status: 200, description: "Active rating reasons list" })
  getTripRatingReasons() {
    return this.tripRatingReasonsService.getAllActive();
  }

  @Get("b2b-fare-settings")
  @ApiOperation({ summary: "Vendor web — B2B fare settings (JWT)" })
  @ApiResponse({ status: 200, description: "B2B fare settings" })
  getFareSettings() {
    return this.b2bFareSettingsService.findOne();
  }

  @Post("s3/public/presigned-image-url")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Vendor web — public S3 upload URLs (JWT)" })
  async publicPresignedImageUrl(
    @Body() body: { files: { fileName: string; fileType: string }[] },
  ) {
    if (!body.files || body.files.length === 0) {
      throw new BadRequestException(
        "Files array is required with at least one item.",
      );
    }
    try {
      const files = await this.s3Service.generatePublicUploadUrls(body.files);
      return { files };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      throw new InternalServerErrorException(message);
    }
  }

  @Post("s3/private/presigned-image-url")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Vendor web — private S3 upload URLs (JWT)" })
  async privatePresignedImageUrl(
    @Body() body: { files: { fileName: string; fileType: string }[] },
  ) {
    if (!body.files || body.files.length === 0) {
      throw new BadRequestException(
        "Files array is required with at least one item.",
      );
    }
    try {
      const files = await this.s3Service.generatePrivateUploadUrls(body.files);
      return { files };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      throw new InternalServerErrorException(message);
    }
  }
}
