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
  BadRequestException,
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
  ApiConsumes,
  ApiProduces,
} from "@nestjs/swagger";
import { DriverService } from "./drivers.service";
import {
  AddDriverPayloadDto,
  UpdateDriverPayloadDto,
  BlockDriverPayloadDto,
  UpdateDriverVerifyStatusDto,
  SendOTPDtoForDriver,
  VerifyOtpDtoForDriver,
} from "./dto/driver.dto";
import { FastifyRequest, FastifyReply } from "fastify";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { CurrentUser, CurrentUserPayload } from "../decorators/current-user.decorator";
import axios from "axios";

const DRIVER_SERVICE_URL =
  process.env.DRIVER_SERVICE_URL ?? "http://localhost:3003/api";

@ApiTags("Add Drivers")
@ApiBearerAuth("JWT-auth")
@Controller("drivers")
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(
    @Inject(DriverService) private readonly driversService: DriverService,
  ) {}
  @Post("add")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add driver with related entities" })
  @ApiBody({ type: AddDriverPayloadDto })
  @ApiResponse({
    status: 201,
    description: "Driver created with related entities",
  })
  async addDriver(
    @Body() payload: AddDriverPayloadDto,
    @Req() req: FastifyRequest,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const driver = await this.driversService.addDriver(payload, token);

    if (driver?.passwordHash) {
      const { passwordHash, ...result } = driver;
      return result;
    }

    return driver;
  }

  @Get()
  @ApiOperation({
    summary: "List all drivers [deprecated path]",
    description:
      "DEPRECATED: prefer GET /web-admin/drivers. Requires Bearer JWT.",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["active", "inactive", "suspended", "pending", "rejected"],
  })
  @ApiQuery({
    name: "onboardingStatus",
    required: false,
    enum: [
      "not_started",
      "in_progress",
      "documents_pending",
      "verification_pending",
      "completed",
      "rejected",
    ],
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10)",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search by name, email or mobile",
  })
  @ApiQuery({
    name: "gender",
    required: false,
    type: String,
    description: "Search by gender",
  })
  @ApiQuery({
    name: "rating",
    required: false,
    type: Number,
    description: "Minimum rating (e.g. 4 returns drivers rated 4.0 and above)",
  })
  @ApiQuery({
    name: "fleetowner_id",
    required: false,
    type: String,
    description: "Search by fleet ID",
  })
  @ApiResponse({
    status: 200,
    description: "List of drivers retrieved successfully",
  })
  async findAll(
    @Req() req: FastifyRequest,
    @Query("status") status?: string,
    @Query("onboardingStatus") onboardingStatus?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("gender") gender?: string,
    // @Query("fleetowner_id") fleetowner_id?: string,
    @Query("fleetOwnerId") fleetOwnerId?: string,
    @Query("rating") rating?: string,

  ) {
    const authHeader = req.headers["authorization"] || "";
    const adminId = req.headers["x-admin-id"] as string | undefined;

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const result = await this.driversService.findAll(
      {
        status,
        onboardingStatus,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search,
        gender,
        // fleetowner_id,
        fleetowner_id: fleetOwnerId,
        rating

      },
      token,
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

  // ─── GET /drivers/cursor ──────────────────────────────────────────────────
  @Get("cursor")
  @ApiOperation({
    summary: "List drivers (cursor pagination, lean list payload) [deprecated path]",
    description:
      "DEPRECATED: prefer GET /web-admin/drivers/cursor. Requires Bearer JWT. " +
      "Keyset-paginated driver list for Admin. Lean fields only — no KYC/docs graphs. " +
      "Pass meta.nextCursor as cursor for the next page.",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["active", "inactive", "suspended", "pending", "rejected", "blocked"],
  })
  @ApiQuery({
    name: "onboardingStatus",
    required: false,
    enum: [
      "not_started",
      "in_progress",
      "documents_pending",
      "verification_pending",
      "completed",
      "rejected",
    ],
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10, max: 100)",
  })
  @ApiQuery({
    name: "cursor",
    required: false,
    type: String,
    description: "Opaque cursor from previous response meta.nextCursor",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search by name, email or mobile",
  })
  @ApiQuery({
    name: "gender",
    required: false,
    type: String,
    description: "Search by gender",
  })
  @ApiQuery({
    name: "rating",
    required: false,
    type: Number,
    description: "Minimum rating band (e.g. 4 returns 4.0–4.99)",
  })
  @ApiQuery({
    name: "fleetOwnerId",
    required: false,
    type: String,
    description: "Filter by fleet owner ID",
  })
  @ApiResponse({
    status: 200,
    description: "Cursor-paginated list of drivers",
  })
  async findAllCursor(
    @Req() req: FastifyRequest,
    @Query("status") status?: string,
    @Query("onboardingStatus") onboardingStatus?: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("search") search?: string,
    @Query("gender") gender?: string,
    @Query("fleetOwnerId") fleetOwnerId?: string,
    @Query("rating") rating?: string,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const adminId = req.headers["x-admin-id"] as string | undefined;

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

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
      },
      token,
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

  // ─── GET /drivers/download ────────────────────────────────────────────────
  @Get("download")
  @ApiOperation({
    summary: "Download drivers as CSV",
    description:
      "Proxies a streamed CSV export from driver-service. Supports the same filters as the drivers list.",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["active", "inactive", "suspended", "pending", "rejected", "blocked"],
  })
  @ApiQuery({
    name: "onboardingStatus",
    required: false,
    enum: [
      "not_started",
      "in_progress",
      "documents_pending",
      "verification_pending",
      "completed",
      "rejected",
    ],
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "gender", required: false })
  @ApiQuery({ name: "fleetOwnerId", required: false })
  @ApiQuery({ name: "rating", required: false, type: Number })
  @ApiProduces("text/csv")
  @ApiResponse({ status: 200, description: "CSV file download" })
  async downloadCsv(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query("status") status?: string,
    @Query("onboardingStatus") onboardingStatus?: string,
    @Query("search") search?: string,
    @Query("gender") gender?: string,
    @Query("fleetOwnerId") fleetOwnerId?: string,
    @Query("rating") rating?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const url = new URL(`${DRIVER_SERVICE_URL}/drivers/download/csv`);

    if (status) url.searchParams.set("status", status);
    if (onboardingStatus) url.searchParams.set("onboardingStatus", onboardingStatus);
    if (search) url.searchParams.set("search", search);
    if (gender) url.searchParams.set("gender", gender);
    if (fleetOwnerId) url.searchParams.set("fleetOwnerId", fleetOwnerId);
    if (rating) url.searchParams.set("rating", rating);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
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
    } catch (err) {
      console.error("Proxy drivers CSV download error:", err);
      return res.status(502).send({ message: "Driver service unavailable" });
    }
  }

  // ─── GET /drivers/:id ─────────────────────────────────────────────────────
  @Get("list-drivers/:id")
  @ApiOperation({
    summary: "Get driver by ID — deprecated",
    description:
      "Deprecated. Prefer GET /web-admin/drivers/:id. Requires Bearer JWT. " +
      "Response includes lastTripsDate for trip partition APIs.",
  })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  @ApiResponse({ status: 200, description: "Driver found" })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const driver = await this.driversService.findOne(id, token);
    const { passwordHash, ...result } = driver as any;
    return result;
  }
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update driver by ID",
    description:
      "Update driver core info and/or any related entity sections. Only provided fields are updated.",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  @ApiBody({ type: UpdateDriverPayloadDto })
  @ApiResponse({ status: 200, description: "Driver updated successfully" })
  @ApiResponse({ status: 404, description: "Driver not found" })
  @ApiResponse({
    status: 409,
    description: "Conflict: email or mobile already in use",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() payload: UpdateDriverPayloadDto,
  ) {
    const driver = await this.driversService.updateDriver(id, payload);
    const { passwordHash, ...result } = driver as any;
    return result;
  }
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Soft-delete driver by ID",
    description:
      "Marks the driver and all related records as deleted (is_deleted = true). " +
      "Does not remove data from the database.",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  @ApiResponse({ status: 200, description: "Driver deleted successfully" })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    return await this.driversService.removeDriver(id, token);
  }

  //  block driver
  @Patch("block/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Block the driver by ID",
    description: "Sets the driver's is_blocked status to true",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  @ApiResponse({ status: 200, description: "Driver blocked successfully" })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async blockDriver(@Param("id", ParseUUIDPipe) id: string) {
    const driver = await this.driversService.blockDriver(id);
    const { ...result } = driver as any;
    return result;
  }

  @Patch("unblock/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Unblock the driver by ID",
    description: "Sets the driver's is_blocked status to false",
  })
  @ApiParam({ name: "id", description: "Driver ID (UUID)" })
  @ApiResponse({ status: 200, description: "Driver unblocked successfully" })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async unblockDriver(@Param("id", ParseUUIDPipe) id: string) {
    const driver = await this.driversService.unblockDriver(id);
    const { ...result } = driver as any;
    return result;
  }

  @Get("overview/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get driver overview by ID",
    description:
      "Returns data for a single driver-detail tab. Pass tab=overview|vehicle-info|trips|track-driver|transaction|review so only that tab's payload is fetched.",
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
    description:
      "Which tab data to return. Defaults to overview (driver profile only).",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    description: "Transaction status filter (tab=transaction)",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date filter (transaction/review)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date filter (transaction/review)",
  })
  @ApiQuery({
    name: "fromDate",
    required: false,
    type: String,
    description: "From date filter (tab=review)",
  })
  @ApiQuery({
    name: "toDate",
    required: false,
    type: String,
    description: "To date filter (tab=review)",
  })
  @ApiQuery({
    name: "rating",
    required: false,
    type: String,
    description: "Rating filter (tab=review)",
  })
  @ApiResponse({ status: 200, description: "Driver overview retrieved" })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async getOverview(
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
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : (authHeader as string);

    return await this.driversService.getDriverOverview(
      id,
      pageNum,
      limitNum,
      tab || "overview",
      token,
      { status, startDate, endDate, fromDate, toDate, rating },
    );
  }

  // driver dropdown api
  @Get("Driver-dropdown")
  @ApiOperation({ summary: "List drivers (id, firstName, lastName)" })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["active", "inactive", "suspended", "pending", "rejected"],
  })
  @ApiQuery({
    name: "onboardingStatus",
    required: false,
    enum: [
      "not_started",
      "in_progress",
      "documents_pending",
      "verification_pending",
      "completed",
      "rejected",
    ],
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search by name, email or mobile",
  })
  @ApiQuery({
    name: "gender",
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "List of drivers (basic info)",
  })
  async dropdowndrivers(
    @Query("status") status?: string,
    @Query("onboardingStatus") onboardingStatus?: string,
    @Query("search") search?: string,
    @Query("gender") gender?: string,
  ) {
    return await this.driversService.dropdowndrivers({
      status,
      onboardingStatus,
      search,
      gender,
    });
  }

  // Transaction list for the driver
  @Get("driver-transactions/:id")
  @ApiOperation({ summary: "Get driver transactions" })
  @ApiParam({
    name: "id",
    description: "Driver ID (UUID)",
    example: "a980d687-8464-48a3-ae98-5e211fcbebe8",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Records per page",
  })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    description: "Filter by transaction status",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Filter from start date (YYYY-MM-DD)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "Filter to end date (YYYY-MM-DD)",
  })
  @ApiResponse({
    status: 200,
    description: "Trip transactions retrieved successfully.",
  })
  @ApiResponse({
    status: 404,
    description: "Trip not found.",
  })
  async getTripTransactions(
    @Param("id") tripId: string,
    @Req() req: FastifyRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    return this.driversService.getTripTransactions(
      tripId,
      token,
      parseInt(page ?? "1", 10),
      parseInt(limit ?? "10", 10),
      status,
      startDate,
      endDate,
    );
  }

  @Get("driver-transactions-cursor/:id")
  @ApiOperation({
    summary: "Admin: driver transactions (cursor) — deprecated",
    description:
      "Deprecated. Prefer GET /web-admin/driver-transactions/:id. " +
      "Requires Bearer JWT. First page uses drivers.last_trips_date.",
  })
  @ApiParam({
    name: "id",
    description: "Driver ID (UUID)",
    example: "a980d687-8464-48a3-ae98-5e211fcbebe8",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Records per page",
  })
  @ApiQuery({
    name: "cursor",
    required: false,
    type: String,
    description: "Opaque cursor from previous meta.nextCursor",
  })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    description: "Filter by transaction status",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Filter from start date (YYYY-MM-DD)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "Filter to end date (YYYY-MM-DD)",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search by trip_id, transaction_id, or trip_uuid",
  })
  @ApiResponse({
    status: 200,
    description: "Cursor-paginated trip transactions retrieved successfully.",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  async getTripTransactionsCursor(
    @Param("id") driverId: string,
    @Req() req: FastifyRequest,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("search") search?: string,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    return this.driversService.getTripTransactionsCursor(
      driverId,
      token,
      parseInt(limit ?? "20", 10),
      cursor,
      status,
      startDate,
      endDate,
      search,
    );
  }

  // Driver summary api
  @Get("stats/counts")
  @ApiOperation({
    summary: "Get driver counts",
    description:
      "Fetches total driver count, inactive driver count, and other driver stats",
  })
  getDriverSummary(@Req() req: FastifyRequest) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    return this.driversService.getDriverSummary(token); // no id
  }
  @Get("stats/aggregated-counts")
  @ApiOperation({
    summary: "Get driver counts (single aggregated query)",
    description:
      "Same fields as /stats/counts, computed in one SQL scan with COUNT(CASE WHEN …).",
  })
  getDriverSummaryAggregated(@Req() req: FastifyRequest) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    return this.driversService.getDriverSummaryAggregated(token);
  }

@Get("stats/count-by-fleetowner")
@ApiOperation({
  summary: "Get total driver count by fleet owner",
})
@ApiQuery({
  name: "fleetowner_id",
  required: true,
  type: String,
})
@ApiResponse({
  status: 200,
  description: "Driver count retrieved successfully",
})
async getCountByFleetOwner(
  @Req() req: FastifyRequest,
  @Query("fleetowner_id") fleetownerId: string,
) {
  const authHeader = req.headers["authorization"] || "";

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;

  return this.driversService.getCountByFleetOwner(
    fleetownerId,
    token,
  );
}

  @Patch("/update-verify-driverstatus/:id")
  @ApiBody({ type: UpdateDriverVerifyStatusDto })
  async updateVerifyStatus(
    @Param("id") id: string,
    @Req() req: FastifyRequest,
    // Proxy endpoint: accept raw body so global forbidNonWhitelisted cannot
    // reject new fields (e.g. driver_profile) before they reach driver-service.
    @Body() payload: Record<string, unknown>,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    return await this.driversService.updateVerifyStatus(id, payload, token);
  }

  // Send OTP to driver for verification
  @Post("driver-send-otp")
  @ApiOperation({
    summary: "Send OTP to driver's phone",
    description:
      "Sends a 6-digit OTP to the driver's registered phone number for verification.",
  })
  @ApiBody({ type: SendOTPDtoForDriver })
  @ApiResponse({
    status: 200,
    description: "OTP sent successfully",
  })
  async sendOTPToDriver(
    @Body() dto: SendOTPDtoForDriver,
    @Req() req: FastifyRequest,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    return this.driversService.sendOTPToDriver(dto, token);
  }

  // Send resend OTP to driver for verification
  @Post("driver-resend-otp")
  @ApiOperation({
    summary: "Resend OTP to driver's phone",
    description:
      "Resends a 6-digit OTP to the driver's registered phone number for verification.",
  })
  @ApiBody({ type: SendOTPDtoForDriver })
  @ApiResponse({
    status: 200,
    description: "OTP resent successfully",
  })
  async resendOTPToDriver(
    @Body() dto: SendOTPDtoForDriver,
    @Req() req: FastifyRequest,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    return this.driversService.sendOTPToDriver(dto, token);
  }

  // Verify the OTP sent to driver for verification
  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify OTP and get JWT token",
    description:
      "Finds the driver by mobile number, validates the OTP, " +
      "and returns a JWT access token on success.",
  })
  @ApiBody({ type: VerifyOtpDtoForDriver })
  @ApiResponse({
    status: 200,
    description: "OTP verified, access token returned",
  })
  @ApiResponse({ status: 401, description: "Invalid or expired OTP" })
  @ApiResponse({
    status: 404,
    description: "Driver not found for given mobile",
  })
  async verifyOtptodriver(
    @Body() dto: VerifyOtpDtoForDriver,
    @Req() req: FastifyRequest,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    return await this.driversService.verifyOtptodriver(dto, token);
  }

  @Get("location-details")
  @ApiOperation({
    summary: "Driver location details [deprecated path]",
    description:
      "DEPRECATED: prefer GET /web-admin/drivers/location-details. Requires Bearer JWT. " +
      "Search drivers and their current locations by name, vehicle, location, and mobile filters.",
  })
  // @ApiQuery({ name: "firstName",    required: false, type: String })
  // @ApiQuery({ name: "lastName",     required: false, type: String })
  // @ApiQuery({ name: "mobile",       required: false, type: String })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search by first name, last name, or mobile",
  })
  @ApiQuery({ name: "vehicleBrand", required: false, type: String })
  @ApiQuery({ name: "vehicleType", required: false, type: String })
  @ApiQuery({
    name: "lat",
    required: false,
    type: Number,
    description: "Latitude for proximity search",
  })
  @ApiQuery({
    name: "lng",
    required: false,
    type: Number,
    description: "Longitude for proximity search",
  })
  @ApiQuery({
    name: "radiusMeters",
    required: false,
    type: Number,
    description: "Search radius in meters (default: 100)",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Max drivers to return (default: 10000, max: 50000)",
  })
  getDriversLocation(
    @Req() req: FastifyRequest,
    // @Query("firstName")    firstName?: string,
    // @Query("lastName")     lastName?: string,
    // @Query("mobile")       mobile?: string,
    @Query("search") search?: string,
    @Query("vehicleBrand") vehicleBrand?: string,
    @Query("vehicleType") vehicleType?: string,
    @Query("lat") lat?: string,
    @Query("lng") lng?: string,
    @Query("radiusMeters") radiusMeters?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    return this.driversService.getDriversLocation(
      token,
      // firstName,
      // lastName,
      // mobile,
      search,
      vehicleBrand,
      vehicleType,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
      radiusMeters ? parseFloat(radiusMeters) : undefined,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10000,
    );
  }

  // import
  // @Public()
  // @Post("driver-import")
  // @HttpCode(HttpStatus.CREATED)
  // @ApiOperation({ summary: "Add driver with related entities" })
  // @ApiBody({ type: ImportDriverDto })
  // @ApiResponse({
  //   status: 201,
  //   description: "Driver created with related entities",
  // })
  // async driverImport(@Body() payload: ImportDriverDto, @Req() req: FastifyRequest) {
  //    const authHeader = req.headers["authorization"] || "";
  //      const token = authHeader.startsWith("Bearer ")
  //   ? authHeader.split(" ")[1]
  //   : authHeader;

  //   const driver = await this.driversService.driverImport(payload, token);

  //   return driver;
  // }
  @Post("driver-import")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Bulk import drivers from Excel (.xlsx)" })
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

    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    return this.driversService.driverImport(
      fileBuffer,
      data.filename,
      data.mimetype,
      token,
    );
  }

  @Patch("transactions/:id/mark-payment")
  @ApiOperation({
    summary:
      "[Deprecated] Admin - mark a trip's driver transaction as Paid/Unpaid",
    description:
      "DEPRECATED: prefer PATCH /web-admin/drivers/transactions/:id/mark-payment. Requires Bearer JWT. :id is transaction_list.id.",
  })
  @ApiParam({
    name: "id",
    description: "transaction_list.id (UUID)",
  })
  async markTransactionPayment(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: FastifyRequest,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    const authHeader = (req.headers["authorization"] as string) || "";
    return this.driversService.markTransactionPayment(
      id,
      { ...body, paidBy: currentUser.id },
      authHeader,
    );
  }
}
