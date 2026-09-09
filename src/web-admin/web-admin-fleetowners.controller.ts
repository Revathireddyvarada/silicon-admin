import {
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
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { FastifyReply, FastifyRequest } from "fastify";
import axios from "axios";
import { FleetownersService } from "../fleetowners/fleetowners.service";
import { CreateFleetownerDto } from "../fleetowners/dto/create-fleetowner.dto";
import { UpdateFleetownerFormDto } from "../fleetowners/dto/update-fleetowner.dto";
import { FleetReviewsQueryDto } from "../fleetowners/dto/fleet-reviews-query.dto";

const FLEETOWNER_SERVICE_URL =
  process.env.FLEETOWNER_SERVICE_URL ?? "http://localhost:3003/api";

@ApiTags("web-admin")
@ApiBearerAuth("JWT-auth")
@Controller("web-admin/fleetowners")
export class WebAdminFleetownersController {
  constructor(private readonly fleetownersService: FleetownersService) {}

  private authHeader(req: FastifyRequest): string {
    return (req.headers["authorization"] as string | undefined) ?? "";
  }

  @Get("list")
  @ApiOperation({
    summary: "Web admin: list fleetowners (JWT)",
    description: "Legacy: GET /fleetowners/list.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "city", required: false })
  @ApiQuery({ name: "stateId", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["createdAt", "name", "email", "companyName", "status"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  listFleetowners(
    @Req() req: FastifyRequest,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("stateId") stateId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    return this.fleetownersService.list(this.authHeader(req), {
      search,
      status,
      city,
      stateId,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get("cursor")
  @ApiOperation({
    summary: "Web admin: list fleetowners (JWT + cursor)",
    description: "Legacy: GET /fleetowners/cursor.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "city", required: false })
  @ApiQuery({ name: "cityId", required: false, description: "Header city UUID" })
  @ApiQuery({ name: "cityName", required: false })
  @ApiQuery({ name: "stateId", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false })
  listFleetownersCursor(
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
    return this.fleetownersService.cursor(this.authHeader(req), {
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

  @Post("create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Web admin: create fleetowner (JWT + multipart)",
    description: "Legacy: POST /fleetowners/create.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: CreateFleetownerDto })
  @ApiHeader({ name: "x-admin-id", required: false })
  async createFleetowner(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const adminId = req.headers["x-admin-id"] as string | undefined;
    const result = await this.fleetownersService.proxyMultipartPost(
      `${FLEETOWNER_SERVICE_URL}/fleetowners`,
      req,
      this.authHeader(req),
      adminId,
    );
    return res.status(result.status).send(result.data);
  }

  @Get("export/data/:format")
  @ApiOperation({
    summary: "Web admin: export fleetowners data (JWT)",
    description: "Legacy: GET /fleetowners/export/data/:format.",
  })
  @ApiParam({ name: "format", enum: ["csv", "json", "excel"] })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "city", required: false })
  @ApiQuery({ name: "stateId", required: false })
  @ApiProduces(
    "application/octet-stream",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  )
  exportFleetowners(
    @Param("format") format: "csv" | "json" | "excel",
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("stateId") stateId?: string,
  ) {
    return this.fleetownersService.exportData(
      this.authHeader(req),
      res,
      format,
      { search, status, city, stateId },
    );
  }

  @Get("reviews/received-cursor")
  @ApiOperation({
    summary: "Web admin: fleet reviews (cursor, JWT)",
    description: "Legacy: GET /fleetowners/reviews/received-cursor.",
  })
  @ApiQuery({ name: "fleetId", required: true })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false })
  @ApiQuery({ name: "rating", required: false, type: Number })
  @ApiQuery({ name: "fromDate", required: false })
  @ApiQuery({ name: "toDate", required: false })
  async getReceivedReviewsCursor(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query("fleetId") fleetId?: string,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
    @Query("rating") rating?: number,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
  ) {
    const driverUrl =
      process.env.DRIVER_SERVICE_URL ?? "http://localhost:3004/api";

    if (!fleetId) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: "fleetId is required",
      });
    }

    const url = new URL(`${driverUrl}/reviews/fleet/${fleetId}/cursor`);
    if (limit) url.searchParams.set("limit", String(limit));
    if (cursor) url.searchParams.set("cursor", cursor);
    if (typeof rating !== "undefined" && rating !== null) {
      url.searchParams.set("rating", String(rating));
    }
    if (fromDate) url.searchParams.set("fromDate", fromDate);
    if (toDate) url.searchParams.set("toDate", toDate);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: this.authHeader(req) },
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy DRIVER REVIEWS CURSOR error:", err);
      return res.status(HttpStatus.BAD_GATEWAY).send({
        message: "Driver service unavailable",
      });
    }
  }

  @Get("reviews/received")
  @ApiOperation({
    summary: "Web admin: fleet reviews (JWT)",
    description: "Legacy: GET /fleetowners/reviews/received.",
  })
  async getReceivedReviews(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query() query: FleetReviewsQueryDto,
  ) {
    const driverUrl =
      process.env.DRIVER_SERVICE_URL ?? "http://localhost:3004/api";
    const fleetId = query.fleetId;

    if (!fleetId) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: "fleetId is required",
      });
    }

    const url = new URL(`${driverUrl}/reviews/fleet/${fleetId}`);
    if (query.page) url.searchParams.set("page", String(query.page));
    if (query.limit) url.searchParams.set("limit", String(query.limit));
    if (typeof query.rating !== "undefined" && query.rating !== null) {
      url.searchParams.set("rating", String(query.rating));
    }
    if (query.fromDate) url.searchParams.set("fromDate", query.fromDate);
    if (query.toDate) url.searchParams.set("toDate", query.toDate);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: this.authHeader(req) },
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy DRIVER REVIEWS error:", err);
      return res.status(HttpStatus.BAD_GATEWAY).send({
        message: "Driver service unavailable",
      });
    }
  }

  @Get(":id")
  @ApiOperation({
    summary: "Web admin: get fleetowner by ID (JWT)",
    description: "Legacy: GET /fleetowners/:id.",
  })
  @ApiParam({ name: "id", description: "Fleetowner ID (UUID)" })
  @ApiQuery({ name: "includeDocuments", required: false, type: Boolean })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getFleetowner(
    @Req() req: FastifyRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("includeDocuments") includeDocuments?: string,
  ) {
    return this.fleetownersService.getById(
      this.authHeader(req),
      id,
      includeDocuments,
    );
  }

  @Patch(":id")
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "id", description: "Fleetowner UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiBody({ type: UpdateFleetownerFormDto })
  @ApiOperation({
    summary: "Web admin: update fleetowner (JWT + multipart)",
    description: "Legacy: PATCH /fleetowners/:id.",
  })
  async updateFleetowner(
    @Param("id") id: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const adminId = req.headers["x-admin-id"] as string | undefined;
    const result = await this.fleetownersService.proxyMultipartPatch(
      `${FLEETOWNER_SERVICE_URL}/fleetowners/${id}`,
      req,
      this.authHeader(req),
      adminId,
    );
    return res.status(result.status).send(result.data);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Web admin: delete fleetowner (JWT)",
    description: "Legacy: DELETE /fleetowners/:id.",
  })
  @ApiParam({ name: "id", description: "Fleetowner UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  deleteFleetowner(@Param("id") id: string, @Req() req: FastifyRequest) {
    const adminId = req.headers["x-admin-id"] as string | undefined;
    return this.fleetownersService.delete(
      this.authHeader(req),
      id,
      adminId,
    );
  }
}
