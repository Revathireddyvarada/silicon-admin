import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Inject,
  Req,
  Res,
  UseGuards,
  Search
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiProduces,
} from "@nestjs/swagger";
import { TripService } from "./trip.service";
import { FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("Trips")
@ApiBearerAuth("JWT-auth")
@Controller("trips")
@UseGuards(JwtAuthGuard)
export class TripController {
  constructor(@Inject(TripService) private readonly tripService: TripService) {}
@Get("driver-trips")
@ApiOperation({ summary: "Get trips list" })
@ApiResponse({
  status: 200,
  description: "Trips retrieved successfully",
})

@ApiQuery({ name: "page", required: false, type: Number })
@ApiQuery({ name: "limit", required: false, type: Number })
@ApiQuery({ name: "vendorId", required: false })
@ApiQuery({ name: "driverId", required: false })
@ApiQuery({ name: "fleetId", required: false })
@ApiQuery({ name:"search",  required:false})
@ApiQuery({ name: "pickupLocation", required: false })
@ApiQuery({ name: "dropLocation", required: false })
@ApiQuery({ name: "status", required: false })
@ApiQuery({ name: "fromDate", required: false })
@ApiQuery({ name: "toDate", required: false })
@ApiQuery({ name: "is_security", required: false })

async getDriverTrips(
  @Req() req: FastifyRequest,
  @Query("page") page?: number,
  @Query("limit") limit?: number,
  @Query("vendorId") vendorId?: string,
  @Query("driverId") driverIdParam?: string,
  @Query("fleetId") fleetId?: string,
  @Query("search") search?: string,
  @Query("pickupLocation") pickupLocation?: string,
  @Query("dropLocation") dropLocation?: string,
  @Query("status") status?: string,
  @Query("fromDate") fromDate?: string,
  @Query("toDate") toDate?: string,
  @Query("is_security") is_security?: string,
) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  const queryParams = {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    vendorId,
    driverId: driverIdParam,
    fleetId,
    search,
    pickupLocation,
    dropLocation,
    status,
    fromDate,
    toDate,
    is_security:
      is_security !== undefined ? is_security === "true" : undefined,
  };

  return await this.tripService.getTrips(token, queryParams);
}


// get trip list 
@Get("gettrip-list/:id")
@ApiOperation({
  summary: "Get trip by ID [deprecated path]",
  description:
    "DEPRECATED: prefer GET /web-admin/trips/gettrip-list/:id. Requires Bearer JWT.",
})
@ApiParam({
  name: "id",
  description: "Trip UUID",
  example: "60ce021a-5ad5-4aa5-a6ef-7a2e3eff2eba",
})
@ApiResponse({ status: 200, description: "Trip list retrieved successfully." })
@ApiResponse({ status: 401, description: "Missing or invalid JWT." })
@ApiResponse({ status: 404, description: "Trip not found." })
async getTripbyId(@Param("id") tripId: string,@Req() req: FastifyRequest,) {
      const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;
  return this.tripService.getTripbyId(tripId, token);
}

// Trips driver overview api'
@Get("overview/:id")
@ApiOperation({ summary: "Get trip overview" })
@ApiParam({
  name: "id",
  description: "Trip UUID",
  example: "aea0dda8-1996-4c03-9547-7e566dddf3d6",
})
@ApiResponse({ status: 200, description: "Trip overview retrieved successfully." })
@ApiResponse({ status: 404, description: "Trip not found." })
async getTripOverview(@Param("id") tripId: string,@Req() req: FastifyRequest,) {
      const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;
  return this.tripService.getTripOverview(tripId, token);
}


// @Public()
// @Get("export/csv")
// @ApiOperation({
//   summary: "Export trip data as CSV",
//   description: "Fetches trip data and exports it as a CSV file",
// })
// tripexportfiles(@Req() req: FastifyRequest) {
//   const authHeader = req.headers["authorization"] || "";
//   const token = authHeader.startsWith("Bearer ")
//     ? authHeader.split(" ")[1]
//     : authHeader;

//   return this.tripService.tripexportfiles(token); 
// }
@Get("export/csv")
@ApiOperation({
  summary: "Export trip data as CSV (streamed)",
  description: "Proxies a streamed CSV export from ride-service.",
})
@ApiQuery({ name: "vendorId", required: false })
@ApiQuery({ name: "driverId", required: false })
@ApiQuery({ name: "fleetId", required: false })
@ApiQuery({
  name: "pickupLocation",
  required: false,
  description: "Partial match on pickup location",
})
@ApiQuery({
  name: "dropLocation",
  required: false,
  description: "Partial match on drop location",
})
@ApiQuery({
  name: "status",
  required: false,
  example: "completed",
})
@ApiQuery({
  name: "fromDate",
  required: false,
  example: "2024-01-01",
})
@ApiQuery({
  name: "toDate",
  required: false,
  example: "2024-12-31",
})
@ApiQuery({
  name: "is_security",
  required: false,
})
@ApiQuery({
  name: "rating",
  required: false,
})
@ApiQuery({
  name:"search",
  required:false
})
@ApiProduces("text/csv")
async tripexportfiles(
  @Req() req: FastifyRequest,
  @Res() res: FastifyReply,
  @Query("vendorId") vendorId?: string,
  @Query("driverId") driverId?: string,
  @Query("fleetId") fleetId?: string,
  @Query("search") search?:string,
  @Query("pickupLocation") pickupLocation?: string,
  @Query("dropLocation") dropLocation?: string,
  @Query("status") status?: string,
  @Query("fromDate") fromDate?: string,
  @Query("toDate") toDate?: string,
  @Query("is_security") is_security?: boolean,
  @Query("rating") rating?: string,
  @Query("cityId") cityId?: string,
) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  const url = new URL(
    `${process.env.RIDE_SERVICE_URL}/trips/export/csv`,
  );
  if (vendorId) url.searchParams.set("vendorId", vendorId);
  if (driverId) url.searchParams.set("driverId", driverId);
  if (fleetId) url.searchParams.set("fleetId", fleetId);
  if (search) url.searchParams.set("search", search);
  if (pickupLocation) url.searchParams.set("pickupLocation", pickupLocation);
  if (dropLocation) url.searchParams.set("dropLocation", dropLocation);
  if (status) url.searchParams.set("status", status);
  if (fromDate) url.searchParams.set("fromDate", fromDate);
  if (toDate) url.searchParams.set("toDate", toDate);
  if (is_security !== undefined) {
    url.searchParams.set("is_security", String(is_security));
  }
  if (rating) url.searchParams.set("rating", rating);
  if (cityId) url.searchParams.set("cityId", cityId);

  try {
    const response = await axios.get(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "stream",
      timeout: 0,
      validateStatus: () => true,
    });

    const filename = `trips_${new Date().toISOString().slice(0, 10)}.csv`;
    res
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .status(response.status);

    response.data.pipe(res.raw);
  } catch (err) {
    console.error("Proxy trips CSV download error:", err);
    return res.status(502).send({ message: "Ride service unavailable" });
  }
}


// Ratings and reviews
@Get("review-ratings")
@ApiOperation({
  summary: "Review trip ratings [deprecated path]",
  description:
    "DEPRECATED: prefer GET /web-admin/trips/review-ratings. Requires Bearer JWT. " +
    "Returns total reviews, average rating, and breakdown per star (1–5) with optional driver/date/rating filters. " +
    "No requestedAt (not partition-routed).",
})
@ApiQuery({ name: "fromDate", required: false })
@ApiQuery({ name: "toDate", required: false })
@ApiQuery({ name: "startDate", required: false })
@ApiQuery({ name: "endDate", required: false })
@ApiQuery({ name: "driverId", required: false })
@ApiQuery({ name: "rating", required: false })
@ApiQuery({ name: "page", required: false, type: Number })
@ApiQuery({ name: "limit", required: false, type: Number })
async reviewTripRatings(
  @Req() req: FastifyRequest,
  @Query()
  filters: {
    fromDate?: string;
    toDate?: string;
    startDate?: string;
    endDate?: string;
    driverId?: string;
    rating?: string;
    page?: string;
    limit?: string;
  },
) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  return this.tripService.reviewTripRatings(token, {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    startDate: filters.startDate,
    endDate: filters.endDate,
    driverId: filters.driverId,
    rating: filters.rating,
    page: filters.page,
    limit: filters.limit,
  });
}



@Get("trip-tracking-details")
@ApiOperation({
  summary: "Get trip tracking details — deprecated",
  description:
    "Deprecated. Prefer GET /web-admin/trip-tracking-details?tripId=&requestedAt=. " +
    "Requires Bearer JWT.",
})
@ApiQuery({ name: "tripId", required: true })
@ApiQuery({
  name: "requestedAt",
  required: false,
  example: "2026-08-10T15:26:36+05:30",
})
@ApiResponse({ status: 401, description: "Missing or invalid JWT." })
async getTripTrackingDetails(
  @Req() req: FastifyRequest,
  @Query("tripId") tripId: string,
  @Query("requestedAt") requestedAt?: string,
) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  return this.tripService.getTripTrackingDetails(token, tripId, requestedAt);
}

@Patch("driver-payment-status/:id")
@ApiOperation({
  summary: "[Deprecated] Mark driver payment for a trip (alias)",
  description:
    "DEPRECATED: prefer PATCH /web-admin/drivers/transactions/:id/mark-payment. " +
    "Accepts paymentStatus or status (Paid/Unpaid). Proxies to driver-service.",
})
@ApiParam({
  name: "id",
  description: "Trip UUID (trips.id) or business trip id",
})
@ApiResponse({ status: 200, description: "Payment status updated." })
@ApiResponse({ status: 404, description: "Trip / transaction not found." })
async markDriverPaymentStatus(
  @Param("id") tripId: string,
  @Body() body: Record<string, unknown>,
  @Req() req: FastifyRequest,
) {
  const authHeader = (req.headers["authorization"] as string) || "";
  return this.tripService.markDriverPaymentStatus(tripId, body ?? {}, authHeader);
}

}