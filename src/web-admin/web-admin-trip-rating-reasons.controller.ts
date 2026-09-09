import { Controller, Get } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { TripRatingReasonsService } from "../trip-rating-reasons/trip-rating-reasons.service";

@ApiTags("web-admin")
@ApiBearerAuth("JWT-auth")
@Controller("web-admin")
export class WebAdminTripRatingReasonsController {
  constructor(private readonly tripRatingReasonsService: TripRatingReasonsService) {}

  @Get("trip-rating-reasons/all")
  @ApiOperation({
    summary: "Web admin — active trip rating reasons (JWT)",
    description:
      "Same data as GET /trip-rating-reasons/all. Requires Bearer JWT. " +
      "Legacy unprefixed path is also available.",
  })
  @ApiResponse({ status: 200, description: "Active rating reasons list" })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT" })
  getTripRatingReasons() {
    return this.tripRatingReasonsService.getAllActive();
  }
}
