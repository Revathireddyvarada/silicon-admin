import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { VehicleTypesService } from "../vehicle-types/vehicle-types.service";
import { TripRatingReasonsService } from "../trip-rating-reasons/trip-rating-reasons.service";
import { CitiesService } from "../cities/cities.service";
import { StatesService } from "../states/states.service";
import { Public } from "../decorators/public.decorator";

/**
 * Read-only masters for Vendor Mobile app.
 * JWT required (global guard) except public dropdowns.
 * No @Roles — vendor tokens are allowed (same pattern as web-vendor masters).
 */
@ApiTags("mobile-vendor")
@ApiBearerAuth("JWT-auth")
@Controller("mobile-vendor")
export class MobileVendorMastersController {
  constructor(
    private readonly vehicleTypesService: VehicleTypesService,
    private readonly tripRatingReasonsService: TripRatingReasonsService,
    private readonly citiesService: CitiesService,
    private readonly statesService: StatesService,
  ) {}

  @Public()
  @Get("states/all")
  @ApiOperation({
    summary: "Mobile vendor — active states dropdown",
    description: "Same data as GET /web-vendor/states/all.",
  })
  @ApiResponse({ status: 200, description: "Active states list" })
  getStates() {
    return this.statesService.getAllActiveStates();
  }

  @Public()
  @Get("cities/all")
  @ApiOperation({
    summary: "Mobile vendor — active cities dropdown",
    description: "Same data as GET /web-vendor/cities/all.",
  })
  @ApiQuery({ name: "state_id", required: false })
  @ApiResponse({ status: 200, description: "Active cities list" })
  getCities(@Query("state_id") stateId?: string) {
    return this.citiesService.getAllActiveCities(stateId ?? "");
  }

  @Get("vehicle-types")
  @ApiOperation({
    summary: "Mobile vendor — active vehicle types (JWT)",
    description:
      "Same data as GET /web-vendor/vehicle-types/all. Requires Bearer JWT.",
  })
  @ApiResponse({ status: 200, description: "Active vehicle types list" })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT" })
  getVehicleTypes() {
    return this.vehicleTypesService.getAllActiveVehicleTypes();
  }

  @Get("vehicle-types/all")
  @ApiOperation({
    summary: "Mobile vendor — active vehicle types dropdown (JWT)",
    description: "Alias of GET /mobile-vendor/vehicle-types.",
  })
  @ApiResponse({ status: 200, description: "Active vehicle types list" })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT" })
  getVehicleTypesAll() {
    return this.vehicleTypesService.getAllActiveVehicleTypes();
  }

  @Get("trip-rating-reasons/all")
  @ApiOperation({
    summary: "Mobile vendor — active trip rating reasons (JWT)",
    description:
      "Same data as GET /web-vendor/trip-rating-reasons/all. Requires Bearer JWT.",
  })
  @ApiResponse({ status: 200, description: "Active rating reasons list" })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT" })
  getTripRatingReasons() {
    return this.tripRatingReasonsService.getAllActive();
  }
}
