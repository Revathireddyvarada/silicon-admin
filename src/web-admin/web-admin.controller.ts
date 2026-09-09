import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProduces,
} from "@nestjs/swagger";
import { FastifyReply, FastifyRequest } from "fastify";
import axios from "axios";
import { DriverService } from "../drivers/drivers.service";
import { TripService } from "../trips/trip.service";
import { WalletService } from "../wallet/wallet.service";
import { VendorsService } from "../vendors/vendors.service";
import { TicketHttpService } from "../ticket-driver/ticket-http.service";
import { VendorTicketHttpService } from "../ticket-vendor/vendor-ticket-http.service";
import { FleetownerTicketHttpService } from "../fleetowner-ticket/fleetowner-ticket-http.service";
import { AdminTicketCursorDto,AdminAssignStaffDto } from "../ticket-driver/dto/ticket-http.dto";
import {
  AddDriverPayloadDto,
  SendOTPDtoForDriver,
  UpdateDriverPayloadDto,
  VerifyOtpDtoForDriver,
} from "../drivers/dto/driver.dto";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../decorators/current-user.decorator";

const DRIVER_SERVICE_URL =
  process.env.DRIVER_SERVICE_URL ?? "http://localhost:3004/api";

const RIDE_SERVICE_URL = (
  process.env.RIDE_SERVICE_URL ?? "http://localhost:3006/api"
).replace(/\/$/, "");

/**
 * Admin Panel (web) APIs — JWT required (global JwtAuthGuard).
 * Naming mirrors mobile-vendor / mobile-driver / driver-service web-admin.
 * Pass requestedAt only on trip partition APIs (tracking / overview), not on these list endpoints.
 */
@ApiTags("web-admin")
@ApiBearerAuth("JWT-auth")
@Controller("web-admin")
export class WebAdminController {
  constructor(
    private readonly driversService: DriverService,
    private readonly tripService: TripService,
    private readonly walletService: WalletService,
    private readonly vendorsService: VendorsService,
    private readonly ticketHttpService: TicketHttpService,
    private readonly vendorTicketHttpService: VendorTicketHttpService,
    private readonly fleetownerTicketHttpService: FleetownerTicketHttpService,
  ) {}

  private extractToken(req: FastifyRequest): string {
    const authHeader = req.headers["authorization"] || "";
    return authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : String(authHeader || "");
  }

  private authHeader(req: FastifyRequest): string {
    return (req.headers["authorization"] as string | undefined) ?? "";
  }

  // ── Drivers (static paths before :id) ─────────────────────────────────────

  @Get("drivers/cursor")
  @ApiOperation({
    summary: "Web admin: list drivers (JWT + cursor)",
    description:
      "Lean cursor-paginated drivers for Admin Panel. Requires Bearer JWT. " +
      "Legacy: GET /drivers/cursor.",
  })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "onboardingStatus", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "gender", required: false })
  @ApiQuery({ name: "fleetOwnerId", required: false })
  @ApiQuery({ name: "rating", required: false, type: Number })
  @ApiQuery({
    name: "b2c",
    required: false,
    type: Boolean,
    description: "true = Active (B2C), false = Active (B2B)",
  })
  @ApiQuery({
    name: "cityId",
    required: false,
    description: "Filter by header city UUID or resolved city name",
  })
  @ApiQuery({ name: "cityName", required: false })
  @ApiResponse({ status: 200, description: "Cursor-paginated drivers." })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  async listDriversCursor(
    @Req() req: FastifyRequest,
    @Query("status") status?: string,
    @Query("onboardingStatus") onboardingStatus?: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("search") search?: string,
    @Query("gender") gender?: string,
    @Query("fleetOwnerId") fleetOwnerId?: string,
    @Query("rating") rating?: string,
    @Query("b2c") b2c?: string,
    @Query("cityId") cityId?: string,
    @Query("city_id") city_id?: string,
    @Query("cityName") cityName?: string,
  ) {
    const adminId = req.headers["x-admin-id"] as string | undefined;
    const result = await this.driversService.findAllCursor(
      {
        status,
        onboardingStatus,
        limit: limit ? parseInt(limit, 10) : 10,
        cursor: cursor || undefined,
        search,
        gender,
        fleetOwnerId,
        rating,
        b2c,
        cityId: cityId?.trim() || city_id?.trim() || undefined,
        cityName: cityName?.trim() || undefined,
      },
      this.extractToken(req),
      adminId,
      req,
    );

    const payload = result?.data ?? result;
    const drivers = Array.isArray(payload?.data) ? payload.data : [];
    const meta = payload?.meta ?? {
      limit: limit ? parseInt(limit, 10) : 10,
      nextCursor: null,
      hasNextPage: false,
      hasPrevPage: Boolean(cursor),
    };

    return {
      data: drivers.map((d: any) => {
        const { passwordHash, ...rest } = d;
        return rest;
      }),
      meta,
    };
  }

  @Get("drivers/location-details")
  @ApiOperation({
    summary: "Web admin: driver location details (JWT)",
    description:
      "Search drivers and current locations for track map. Requires Bearer JWT. " +
      "Legacy: GET /drivers/location-details.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "vehicleBrand", required: false })
  @ApiQuery({ name: "vehicleType", required: false })
  @ApiQuery({ name: "lat", required: false, type: Number })
  @ApiQuery({ name: "lng", required: false, type: Number })
  @ApiQuery({ name: "radiusMeters", required: false, type: Number })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "liveStatus", required: false })
  @ApiQuery({ name: "zoneId", required: false })
  @ApiQuery({ name: "driverId", required: false })
  @ApiQuery({ name: "vendorId", required: false })
  @ApiQuery({ name: "cityId", required: false })
  @ApiQuery({
    name: "compact",
    required: false,
    description: "Map payload without profile photos (fast all-drivers view)",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getDriversLocation(
    @Req() req: FastifyRequest,
    @Query("search") search?: string,
    @Query("vehicleBrand") vehicleBrand?: string,
    @Query("vehicleType") vehicleType?: string,
    @Query("lat") lat?: string,
    @Query("lng") lng?: string,
    @Query("radiusMeters") radiusMeters?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("liveStatus") liveStatus?: string,
    @Query("zoneId") zoneId?: string,
    @Query("compact") compact?: string,
    @Query("driverId") driverId?: string,
    @Query("vendorId") vendorId?: string,
    @Query("cityId") cityId?: string,
  ) {
    return this.driversService.getDriversLocation(
      this.extractToken(req),
      search,
      vehicleBrand,
      vehicleType,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
      radiusMeters ? parseFloat(radiusMeters) : undefined,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      liveStatus,
      zoneId,
      compact === "true" || compact === "1",
      driverId,
      vendorId,
      cityId,
    );
  }

  @Get("drivers/overview/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Web admin: driver overview by ID (JWT)",
    description: "Legacy: GET /drivers/overview/:id.",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  @ApiQuery({
    name: "tab",
    required: false,
    enum: [
      "overview",
      "vehicle-info",
      "trips",
      "track-driver",
      "transaction",
      "review",
    ],
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "fromDate", required: false })
  @ApiQuery({ name: "toDate", required: false })
  @ApiQuery({ name: "rating", required: false })
  getDriverOverview(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
    @Query("tab") tab?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
    @Query("rating") rating?: string,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    return this.driversService.getDriverOverview(
      id,
      pageNum,
      limitNum,
      tab || "overview",
      this.extractToken(req),
      { status, startDate, endDate, fromDate, toDate, rating },
    );
  }

  @Get("drivers/stats/counts")
  @ApiOperation({
    summary: "Web admin: driver counts (JWT)",
    description: "Legacy: GET /drivers/stats/counts.",
  })
  getDriverSummary(@Req() req: FastifyRequest) {
    return this.driversService.getDriverSummary(this.extractToken(req));
  }

  @Get("drivers/stats/aggregated-counts")
  @ApiOperation({
    summary: "Web admin: aggregated driver counts (JWT)",
    description: "Legacy: GET /drivers/stats/aggregated-counts.",
  })
  getDriverSummaryAggregated(@Req() req: FastifyRequest) {
    return this.driversService.getDriverSummaryAggregated(
      this.extractToken(req),
    );
  }

  @Get("drivers/download")
  @ApiOperation({
    summary: "Web admin: download drivers CSV (JWT)",
    description: "Legacy: GET /drivers/download.",
  })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "onboardingStatus", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "gender", required: false })
  @ApiQuery({ name: "fleetOwnerId", required: false })
  @ApiQuery({ name: "rating", required: false, type: Number })
  @ApiQuery({ name: "b2c", required: false, type: Boolean })
  @ApiProduces("text/csv")
  async downloadDriversCsv(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query("status") status?: string,
    @Query("onboardingStatus") onboardingStatus?: string,
    @Query("search") search?: string,
    @Query("gender") gender?: string,
    @Query("fleetOwnerId") fleetOwnerId?: string,
    @Query("rating") rating?: string,
    @Query("b2c") b2c?: string,
  ) {
    const url = new URL(`${DRIVER_SERVICE_URL}/drivers/download/csv`);
    if (status) url.searchParams.set("status", status);
    if (onboardingStatus) {
      url.searchParams.set("onboardingStatus", onboardingStatus);
    }
    if (search) url.searchParams.set("search", search);
    if (gender) url.searchParams.set("gender", gender);
    if (fleetOwnerId) url.searchParams.set("fleetOwnerId", fleetOwnerId);
    if (rating) url.searchParams.set("rating", rating);
    if (b2c !== undefined && b2c !== "") url.searchParams.set("b2c", b2c);

    const response = await axios.get(url.toString(), {
      headers: { Authorization: this.authHeader(req) },
      responseType: "stream",
      timeout: 0,
      validateStatus: () => true,
    });

    const filename = `drivers_${new Date().toISOString().slice(0, 10)}.csv`;
    res
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .status(response.status);

    response.data.pipe(res.raw);
  }

  @Post("drivers/driver-send-otp")
  @ApiOperation({
    summary: "Web admin: send OTP to driver (JWT)",
    description: "Legacy: POST /drivers/driver-send-otp.",
  })
  @ApiBody({ type: SendOTPDtoForDriver })
  sendOTPToDriver(
    @Body() dto: SendOTPDtoForDriver,
    @Req() req: FastifyRequest,
  ) {
    return this.driversService.sendOTPToDriver(dto, this.extractToken(req));
  }

  @Post("drivers/driver-resend-otp")
  @ApiOperation({
    summary: "Web admin: resend OTP to driver (JWT)",
    description: "Legacy: POST /drivers/driver-resend-otp.",
  })
  @ApiBody({ type: SendOTPDtoForDriver })
  resendOTPToDriver(
    @Body() dto: SendOTPDtoForDriver,
    @Req() req: FastifyRequest,
  ) {
    return this.driversService.sendOTPToDriver(dto, this.extractToken(req));
  }

  @Post("drivers/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Web admin: verify driver OTP (JWT)",
    description: "Legacy: POST /drivers/verify-otp.",
  })
  @ApiBody({ type: VerifyOtpDtoForDriver })
  verifyOtptodriver(
    @Body() dto: VerifyOtpDtoForDriver,
    @Req() req: FastifyRequest,
  ) {
    return this.driversService.verifyOtptodriver(dto, this.extractToken(req));
  }

  @Post("drivers/driver-import")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Web admin: bulk import drivers (JWT + multipart)",
    description: "Legacy: POST /drivers/driver-import.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  async driverImport(@Req() req: FastifyRequest) {
    if (!req.isMultipart()) {
      throw new BadRequestException("Request must be multipart/form-data");
    }

    const data = await req.file();
    if (!data) {
      throw new BadRequestException("No file uploaded");
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    return this.driversService.driverImport(
      fileBuffer,
      data.filename,
      data.mimetype,
      this.extractToken(req),
    );
  }

  @Post("drivers/add")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Web admin: add driver (JWT)",
    description: "Legacy: POST /drivers/add.",
  })
  @ApiBody({ type: AddDriverPayloadDto })
  async addDriver(
    @Body() payload: AddDriverPayloadDto,
    @Req() req: FastifyRequest,
  ) {
    const driver = await this.driversService.addDriver(
      payload,
      this.extractToken(req),
    );

    if (driver?.passwordHash) {
      const { passwordHash, ...result } = driver;
      return result;
    }

    return driver;
  }

  @Patch("drivers/block/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Web admin: block driver (JWT)",
    description: "Legacy: PATCH /drivers/block/:id.",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  blockDriver(@Param("id", ParseUUIDPipe) id: string) {
    return this.driversService.blockDriver(id);
  }

  @Patch("drivers/unblock/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Web admin: unblock driver (JWT)",
    description: "Legacy: PATCH /drivers/unblock/:id.",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  unblockDriver(@Param("id", ParseUUIDPipe) id: string) {
    return this.driversService.unblockDriver(id);
  }

  @Patch("drivers/update-verify-driverstatus/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Web admin: update driver verify status (JWT)",
    description: "Legacy: PATCH /drivers/update-verify-driverstatus/:id.",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  updateVerifyDriverStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.driversService.updateVerifyStatus(
      id,
      payload,
      this.extractToken(req),
    );
  }

  @Get("drivers")
  @ApiOperation({
    summary: "Web admin: list drivers (JWT + offset pagination)",
    description:
      "Offset-paginated drivers for Admin Panel. Requires Bearer JWT. " +
      "Legacy: GET /drivers.",
  })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "onboardingStatus", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "gender", required: false })
  @ApiQuery({ name: "fleetOwnerId", required: false })
  @ApiQuery({ name: "rating", required: false, type: Number })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  async listDrivers(
    @Req() req: FastifyRequest,
    @Query("status") status?: string,
    @Query("onboardingStatus") onboardingStatus?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("gender") gender?: string,
    @Query("fleetOwnerId") fleetOwnerId?: string,
    @Query("rating") rating?: string,
  ) {
    const adminId = req.headers["x-admin-id"] as string | undefined;
    const result = await this.driversService.findAll(
      {
        status,
        onboardingStatus,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search,
        gender,
        fleetowner_id: fleetOwnerId,
        rating,
      },
      this.extractToken(req),
      adminId,
      req,
    );
    return {
      data: result.data.data.map((d: any) => {
        const { passwordHash, ...rest } = d;
        return rest;
      }),
      total: result.data.total,
      page: result.data.page,
      limit: result.data.limit,
      totalPages: result.data.totalPages,
    };
  }


  @Get("drivers/stats/count-by-fleetowner")
@ApiOperation({
  summary: "Web admin: driver count by fleet owner (JWT)",
  description: "Legacy: GET /drivers/stats/count-by-fleetowner.",
})
@ApiQuery({ name: "fleetowner_id", required: true, type: String })
@ApiResponse({ status: 200, description: "Driver count retrieved successfully" })
getCountByFleetOwner(
  @Req() req: FastifyRequest,
  @Query("fleetowner_id") fleetownerId: string,
) {
  return this.driversService.getCountByFleetOwner(
    fleetownerId,
    this.extractToken(req),
  );
}

  @Get("drivers/:id")
  @ApiOperation({
    summary: "Web admin: get driver by ID (JWT)",
    description:
      "Driver details for Admin Panel. Requires Bearer JWT. " +
      "Response includes lastTripsDate — pass as requestedAt on trip APIs. " +
      "Legacy: GET /drivers/list-drivers/:id.",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  @ApiResponse({ status: 200, description: "Driver found" })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async getDriver(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
  ) {
    const driver = await this.driversService.findOne(
      id,
      this.extractToken(req),
    );
    const { passwordHash, ...result } = driver as any;
    return result;
  }

  @Patch("drivers/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Web admin: update driver (JWT)",
    description: "Legacy: PATCH /drivers/:id.",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  @ApiBody({ type: UpdateDriverPayloadDto })
  async updateDriver(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() payload: UpdateDriverPayloadDto,
  ) {
    const driver = await this.driversService.updateDriver(id, payload);
    const { passwordHash, ...result } = driver as any;
    return result;
  }

  @Delete("drivers/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Web admin: delete driver (JWT)",
    description: "Legacy: DELETE /drivers/:id.",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  removeDriver(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
  ) {
    return this.driversService.removeDriver(id, this.extractToken(req));
  }

  @Get("driver-transactions/:id")
  @ApiOperation({
    summary: "Web admin: driver transactions (JWT + cursor)",
    description:
      "Cursor-paginated transactions for Admin Panel driver view. " +
      "Requires Bearer JWT. First page uses drivers.last_trips_date. " +
      "Legacy: GET /drivers/driver-transactions-cursor/:id.",
  })
  @ApiParam({
    name: "id",
    description: "Driver ID (UUID)",
    example: "108b1541-6153-42ad-bd3a-fe61765b54f9",
  })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false, type: String })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiResponse({ status: 200, description: "Transactions retrieved." })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getDriverTransactions(
    @Param("id") driverId: string,
    @Req() req: FastifyRequest,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("search") search?: string,
  ) {
    return this.driversService.getTripTransactionsCursor(
      driverId,
      this.extractToken(req),
      parseInt(limit ?? "20", 10),
      cursor,
      status,
      startDate,
      endDate,
      search,
    );
  }

  @Patch("drivers/transactions/:id/mark-payment")
  @ApiOperation({
    summary: "Web admin: mark driver transaction payment (JWT)",
    description:
      "Mark a driver transaction as Paid/Unpaid. Requires Bearer JWT. " +
      ":id is transaction_list.id (UUID). " +
      "Legacy: PATCH /drivers/transactions/:id/mark-payment.",
  })
  @ApiParam({
    name: "id",
    description: "transaction_list.id (UUID)",
    example: "6dea2d1f-c6e8-432e-b151-58818cc48fae",
  })
  @ApiResponse({ status: 200, description: "Transaction payment updated." })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  @ApiResponse({ status: 404, description: "Transaction not found." })
  markTransactionPayment(
    @Param("id") id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: FastifyRequest,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.driversService.markTransactionPayment(
      id,
      { ...(body ?? {}), paidBy: currentUser?.id },
      this.authHeader(req),
    );
  }

  // ── Trips (non-partition list/ratings — no requestedAt) ───────────────────

  @Get(["trips/download", "trips/export/csv"])
  @ApiOperation({
    summary: "Web admin: download trips CSV (JWT)",
    description:
      "Streams filtered trips CSV from ride-service. " +
      "Legacy: GET /trips/export/csv. Admin FE uses GET /web-admin/trips/download.",
  })
  @ApiQuery({ name: "vendorId", required: false })
  @ApiQuery({ name: "driverId", required: false })
  @ApiQuery({ name: "fleetId", required: false })
  @ApiQuery({ name: "pickupLocation", required: false })
  @ApiQuery({ name: "dropLocation", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "fromDate", required: false })
  @ApiQuery({ name: "toDate", required: false })
  @ApiQuery({ name: "is_security", required: false })
  @ApiQuery({ name: "rating", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "cityId", required: false })
  @ApiProduces("text/csv")
  async downloadTripsCsv(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query("vendorId") vendorId?: string,
    @Query("driverId") driverId?: string,
    @Query("fleetId") fleetId?: string,
    @Query("search") search?: string,
    @Query("pickupLocation") pickupLocation?: string,
    @Query("dropLocation") dropLocation?: string,
    @Query("status") status?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
    @Query("is_security") is_security?: boolean,
    @Query("rating") rating?: string,
    @Query("cityId") cityId?: string,
  ) {
    const url = new URL(`${RIDE_SERVICE_URL}/trips/export/csv`);
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
        headers: { Authorization: this.authHeader(req) },
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

  @Get("trips/gettrip-list/:id")
  @ApiOperation({
    summary: "Web admin: get trip by ID (JWT)",
    description:
      "Trip detail for Admin Panel (e.g. review date lookup). Requires Bearer JWT. " +
      "Legacy: GET /trips/gettrip-list/:id.",
  })
  @ApiParam({
    name: "id",
    description: "Trip UUID",
    example: "60ce021a-5ad5-4aa5-a6ef-7a2e3eff2eba",
  })
  @ApiResponse({ status: 200, description: "Trip retrieved." })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  @ApiResponse({ status: 404, description: "Trip not found." })
  getTripById(
    @Param("id") tripId: string,
    @Req() req: FastifyRequest,
  ) {
    return this.tripService.getTripbyId(tripId, this.extractToken(req));
  }

  @Get("trips/review-ratings")
  @ApiOperation({
    summary: "Web admin: trip review ratings (JWT)",
    description:
      "Ratings aggregate/list for Admin Panel. Requires Bearer JWT. " +
      "No requestedAt (not partition-routed). Legacy: GET /trips/review-ratings.",
  })
  @ApiQuery({ name: "fromDate", required: false })
  @ApiQuery({ name: "toDate", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "driverId", required: false })
  @ApiQuery({ name: "rating", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  reviewTripRatings(
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
    return this.tripService.reviewTripRatings(this.extractToken(req), {
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
    summary: "Web admin: trip tracking details (JWT)",
    description:
      "Requires Bearer JWT. Pass requestedAt for partition prune. " +
      "Legacy: GET /trips/trip-tracking-details.",
  })
  @ApiQuery({ name: "tripId", required: true })
  @ApiQuery({
    name: "requestedAt",
    required: false,
    example: "2026-08-10T15:26:36+05:30",
  })
  @ApiResponse({ status: 200, description: "Tracking details returned." })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getTripTrackingDetails(
    @Req() req: FastifyRequest,
    @Query("tripId") tripId: string,
    @Query("requestedAt") requestedAt?: string,
  ) {
    return this.tripService.getTripTrackingDetails(
      this.extractToken(req),
      tripId,
      requestedAt,
    );
  }

  // ── Vendors ───────────────────────────────────────────────────────────────

  @Get("vendors/cursor")
  @ApiOperation({
    summary: "Web admin: list vendors (JWT + cursor)",
    description:
      "Requires Bearer JWT. Legacy: GET /vendors/cursor.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "city", required: false })
  @ApiQuery({ name: "cityId", required: false, description: "Header city UUID" })
  @ApiQuery({ name: "cityName", required: false })
  @ApiQuery({ name: "stateId", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  listVendorsCursor(
    @Req() req: FastifyRequest,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("cityId") cityId?: string,
    @Query("city_id") city_id?: string,
    @Query("cityName") cityName?: string,
    @Query("stateId") stateId?: string,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
  ) {
    return this.vendorsService.listVendorsCursor(this.authHeader(req), {
      search,
      status,
      city,
      cityId: cityId?.trim() || city_id?.trim() || undefined,
      cityName: cityName?.trim() || undefined,
      stateId,
      limit,
      cursor,
    });
  }

  // ── Tickets ───────────────────────────────────────────────────────────────

  @Get("tickets/vendor/cursor")
  @ApiOperation({
    summary: "Web admin: vendor tickets (JWT + cursor)",
    description: "Proxies vendor-service ticket cursor list.",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  listVendorTicketsCursor(@Query() query: AdminTicketCursorDto) {
    return this.vendorTicketHttpService.getTicketsCursor(query);
  }

  // @Get("vendor/tickets/:id/conversations")
  // @ApiOperation({
  //   summary: "Web admin: list conversations for a vendor ticket (JWT)",
  // })
  // @ApiParam({ name: "id", description: "Ticket UUID" })
  // @ApiResponse({ status: 200, description: "Conversations retrieved." })
  // @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  // getVendorTicketConversations(@Param("id", ParseUUIDPipe) id: string) {
  //   return this.vendorTicketHttpService.getConversations(id);
  // }

  // @Get("vendor/tickets/:id")
  // @ApiOperation({
  //   summary: "Web admin: get a single vendor ticket by ID (JWT)",
  // })
  // @ApiParam({ name: "id", description: "Ticket UUID" })
  // @ApiResponse({ status: 200, description: "Ticket retrieved." })
  // @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  // @ApiResponse({ status: 404, description: "Ticket not found." })
  // getVendorTicketById(@Param("id", ParseUUIDPipe) id: string) {
  //   return this.vendorTicketHttpService.getTicketById(id);
  // }

  @Get("tickets/fleetowner/cursor")
  @ApiOperation({
    summary: "Web admin: fleetowner tickets (JWT + cursor)",
    description: "Proxies fleetowner-service ticket cursor list.",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  listFleetownerTicketsCursor(@Query() query: AdminTicketCursorDto) {
    return this.fleetownerTicketHttpService.getTicketsCursor(query);
  }

  // @Get("fleetowner/tickets/:id/conversations")
  // @ApiOperation({
  //   summary: "Web admin: list conversations for a fleetowner ticket (JWT)",
  // })
  // @ApiParam({ name: "id", description: "Ticket UUID" })
  // @ApiResponse({ status: 200, description: "Conversations retrieved." })
  // @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  // getFleetownerTicketConversations(@Param("id", ParseUUIDPipe) id: string) {
  //   return this.fleetownerTicketHttpService.getConversations(id);
  // }

  // @Get("fleetowner/tickets/:id")
  // @ApiOperation({
  //   summary: "Web admin: get a single fleetowner ticket by ID (JWT)",
  // })
  // @ApiParam({ name: "id", description: "Ticket UUID" })
  // @ApiResponse({ status: 200, description: "Ticket retrieved." })
  // @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  // @ApiResponse({ status: 404, description: "Ticket not found." })
  // getFleetownerTicketById(@Param("id", ParseUUIDPipe) id: string) {
  //   return this.fleetownerTicketHttpService.getTicketById(id);
  // }


  // @Patch("fleetowner/tickets/:id/assign")
  // assignFleetownerTicketStaff(
  // @Param("id", ParseUUIDPipe) id: string,
  // @Body() dto: AdminAssignStaffDto,
  // ) {
  // return this.fleetownerTicketHttpService.assignStaff(id, dto.staffId);
  // }

  // @Get("tickets/cursor")
  // @ApiOperation({
  //   summary: "Web admin: list tickets (JWT + cursor)",
  //   description:
  //     "Requires Bearer JWT. Legacy: GET /admin/tickets/cursor.",
  // })
  // @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  // listTicketsCursor(@Query() query: AdminTicketCursorDto) {
  //   return this.ticketHttpService.getTicketsCursor(query);
  // }


//   @Patch("tickets/:id/assign")
// @ApiOperation({
//   summary: "Web admin: assign staff to ticket (JWT)",
//   description: "Legacy: PATCH /admin/tickets/:id/assign.",
// })
// @ApiParam({ name: "id", description: "Ticket UUID" })
// @ApiBody({ type: AdminAssignStaffDto })
// @ApiResponse({ status: 200, description: "Staff assigned" })
// @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
// assignTicketStaff(
//   @Param("id", ParseUUIDPipe) id: string,
//   @Body() dto: AdminAssignStaffDto,
// ) {
//   return this.ticketHttpService.assignStaff(id, dto.staffId);
// }


// @Get("tickets/:id")
// @ApiOperation({
//   summary: "Web admin: get a single driver ticket by ID (JWT)",
//   description: "Legacy: GET /admin/tickets/:id.",
// })
// @ApiParam({ name: "id", description: "Ticket UUID" })
// @ApiResponse({ status: 200, description: "Ticket retrieved." })
// @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
// @ApiResponse({ status: 404, description: "Ticket not found." })
// getTicketById(@Param("id", ParseUUIDPipe) id: string) {
//   return this.ticketHttpService.getTicketById(id);
// }

// @Get("tickets/:id/conversations")
// @ApiOperation({
//   summary: "Web admin: list conversations for a driver ticket (JWT)",
//   description: "Legacy: GET /admin/tickets/:id/conversations.",
// })
// @ApiParam({ name: "id", description: "Ticket UUID" })
// @ApiResponse({ status: 200, description: "Conversations retrieved." })
// @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
// @ApiResponse({ status: 404, description: "Ticket not found." })
// getTicketConversations(@Param("id", ParseUUIDPipe) id: string) {
//   return this.ticketHttpService.getConversations(id);
// }

  // ── Wallet ────────────────────────────────────────────────────────────────

  @Get("wallet/summary")
  @ApiOperation({
    summary: "Web admin: wallet summary cards (JWT)",
    description: "Legacy: GET /admin/wallet/summary.",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getWalletSummary(@Req() req: FastifyRequest) {
    return this.walletService.getWalletSummary(this.authHeader(req));
  }

  @Get("wallet/dashboard")
  @ApiOperation({
    summary: "Web admin: wallet dashboard (JWT)",
    description: "Legacy: GET /admin/wallet/dashboard.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sortBy", required: false })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiQuery({ name: "from_date", required: false })
  @ApiQuery({ name: "to_date", required: false })
  @ApiQuery({ name: "min_amount", required: false, type: Number })
  @ApiQuery({ name: "max_amount", required: false, type: Number })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getWalletDashboard(
    @Req() req: FastifyRequest,
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "ASC" | "DESC",
    @Query("from_date") from_date?: string,
    @Query("to_date") to_date?: string,
    @Query("min_amount") min_amount?: number,
    @Query("max_amount") max_amount?: number,
  ) {
    return this.walletService.getWalletDashboard(
      this.authHeader(req),
      search,
      page,
      limit,
      sortBy,
      sortOrder,
      from_date,
      to_date,
      min_amount,
      max_amount,
    );
  }

  @Get("wallet/vendors/download")
  @ApiOperation({
    summary: "Web admin: download vendors wallet CSV (JWT)",
    description: "Legacy: GET /admin/wallet/download.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "sortBy", required: false })
  @ApiQuery({ name: "sortOrder", required: false })
  @ApiQuery({ name: "from_date", required: false })
  @ApiQuery({ name: "to_date", required: false })
  @ApiQuery({ name: "min_amount", required: false, type: Number })
  @ApiQuery({ name: "max_amount", required: false, type: Number })
  @ApiProduces("text/csv")
  async downloadWalletVendors(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
    @Query("from_date") from_date?: string,
    @Query("to_date") to_date?: string,
    @Query("min_amount") min_amount?: number,
    @Query("max_amount") max_amount?: number,
  ) {
    const data = await this.walletService.downloadWalletCsv(
      this.authHeader(req),
      {
        search,
        sortBy,
        sortOrder,
        from_date,
        to_date,
        min_amount,
        max_amount,
      },
    );
    const filename = `vendors-wallet_${new Date().toISOString().slice(0, 10)}.csv`;
    res
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(data);
  }

  @Get("wallet/vendors")
  @ApiOperation({
    summary: "Web admin: wallet vendors (JWT + cursor)",
    description:
      "Requires Bearer JWT. Legacy: GET /admin/wallet/vendors-cursor.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false })
  @ApiQuery({ name: "sortBy", required: false })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiQuery({ name: "from_date", required: false })
  @ApiQuery({ name: "to_date", required: false })
  @ApiQuery({ name: "min_amount", required: false, type: Number })
  @ApiQuery({ name: "max_amount", required: false, type: Number })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getWalletVendors(
    @Req() req: FastifyRequest,
    @Query("search") search?: string,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "ASC" | "DESC",
    @Query("from_date") from_date?: string,
    @Query("to_date") to_date?: string,
    @Query("min_amount") min_amount?: number,
    @Query("max_amount") max_amount?: number,
  ) {
    return this.walletService.getWalletVendorsCursor(this.authHeader(req), {
      search,
      limit,
      cursor,
      sortBy,
      sortOrder,
      from_date,
      to_date,
      min_amount,
      max_amount,
    });
  }

  @Get("wallet/refund-requests")
  @ApiOperation({
    summary: "Web admin: refund requests (JWT + cursor)",
    description:
      "Requires Bearer JWT. Legacy: GET /admin/wallet/refund-requests-cursor.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "refund_type", required: false })
  @ApiQuery({ name: "refund_status", required: false })
  @ApiQuery({ name: "from_date", required: false })
  @ApiQuery({ name: "to_date", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getRefundRequests(
    @Req() req: FastifyRequest,
    @Query("search") search?: string,
    @Query("refund_type") refund_type?: string,
    @Query("refund_status") refund_status?: string,
    @Query("from_date") from_date?: string,
    @Query("to_date") to_date?: string,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
  ) {
    return this.walletService.getAllRefundRequestsCursor(this.authHeader(req), {
      search,
      refund_type,
      refund_status,
      from_date,
      to_date,
      limit,
      cursor,
    });
  }

  @Get("wallet/refund-requests/download")
  @ApiOperation({
    summary: "Web admin: download refund requests CSV (JWT)",
    description: "Legacy: GET /admin/wallet/refund-requests/download.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "refund_type", required: false })
  @ApiQuery({ name: "refund_status", required: false })
  @ApiQuery({ name: "from_date", required: false })
  @ApiQuery({ name: "to_date", required: false })
  @ApiProduces("text/csv")
  async downloadRefundRequests(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("refund_type") refund_type?: string,
    @Query("refund_status") refund_status?: string,
    @Query("from_date") from_date?: string,
    @Query("to_date") to_date?: string,
  ) {
    const result = await this.walletService.downloadRefundRequests(
      this.authHeader(req),
      { search, refund_type, refund_status, from_date, to_date },
    );
    res
      .header("Content-Type", result.contentType)
      .header(
        "Content-Disposition",
        `attachment; filename="${result.filename}"`,
      )
      .send(result.data);
  }


  @Get("wallet/refund-requests/:id")
  @ApiOperation({
  summary: "Web admin: get a single refund request (JWT)",
  description: "Legacy: GET /admin/wallet/refund-requests/:id.",
  })
  @ApiParam({ name: "id", description: "Refund UUID or RFD-XXXX request_id" })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
    getRefundById(@Param("id") id: string, @Req() req: FastifyRequest) {
      return this.walletService.getRefundById(id, this.authHeader(req));
  }

   @Patch("wallet/refund-requests/:id")
  @ApiOperation({
    summary:
      "Web admin: confirm / update a refund request (JWT). General: zero wallet, trip: credit wallet.",
    description: "Legacy: PATCH /admin/wallet/refund-requests/:id.",
  })
  @ApiParam({ name: "id", description: "Refund UUID or RFD-XXXX request_id" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["status"],
      properties: {
        status: {
          type: "string",
          enum: ["Requested", "Approved", "Processing", "Refunded"],
        },
        refund_amount: {
          type: "number",
          description: "Amount in rupees (required for trip refunds)",
        },
        payment_transaction_id: { type: "string" },
        description: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  confirmRefund(
    @Param("id") id: string,
    @Body()
    body: {
      status: string;
      refund_amount?: number;
      payment_transaction_id?: string;
      description?: string;
    },
    @Req() req: FastifyRequest,
  ) {
    return this.walletService.confirmRefund(id, this.authHeader(req), body);
  }

}