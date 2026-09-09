import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Get,
  Patch,
  Delete,
  Query,
  Req,
  Res,
  UseGuards,
  HttpException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiHeader,
  ApiProduces,
} from "@nestjs/swagger";
import axios from "axios";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { CreateFleetownerDto } from "./dto/create-fleetowner.dto";
import { UpdateFleetownerFormDto } from "./dto/update-fleetowner.dto";
import { VerifyFleetownerDto } from "./dto/verify-fleetowner.dto";
import { FleetReviewsQueryDto } from "./dto/fleet-reviews-query.dto";
import { FastifyReply } from "fastify";

const FLEETOWNER_SERVICE_URL =
  process.env.FLEETOWNER_SERVICE_URL ?? "http://localhost:3003/api";

@ApiTags("fleetowners")
@ApiBearerAuth("JWT-auth")
@Controller("fleetowners")
@UseGuards(JwtAuthGuard)
export class FleetownersController {
  @Post("create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create fleetowner (admin/staff)",
    description: "Create a new fleetowner via fleetowner-service.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: CreateFleetownerDto })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiResponse({ status: 201, description: "Fleetowner created successfully" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({
    status: 409,
    description: "Fleetowner with email already exists",
  })
  async createFleetowner(@Req() req: any, @Res() res: FastifyReply) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const adminId = req.headers["x-admin-id"] as string | undefined;
    const url = `${FLEETOWNER_SERVICE_URL}/fleetowners`;

    try {
      const response = await axios.post(url, req.raw, {
        headers: {
          Authorization: authHeader ?? "",
          "content-type": req.headers["content-type"], // keep boundary
          "x-admin-id": adminId ?? null,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy error:", err);
      return res
        .status(502)
        .send({ message: "Fleet owner service unavailable" });
    }
  }

  //  @Public()
  @Get("cursor")
  @ApiOperation({
    summary: "List fleetowners (cursor pagination)",
    description:
      "Keyset-paginated fleetowners via fleetowner-service. Pass meta.nextCursor as cursor.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "city", required: false })
  @ApiQuery({ name: "stateId", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiQuery({
    name: "cursor",
    required: false,
    description: "Opaque nextCursor from previous response",
  })
  @ApiResponse({ status: 200, description: "Cursor-paginated fleetowners" })
  async listFleetownersCursor(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("stateId") stateId?: string,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const url = new URL(`${FLEETOWNER_SERVICE_URL}/fleetowners/cursor`);

    if (search) url.searchParams.set("search", search);
    if (status) url.searchParams.set("status", status);
    if (city) url.searchParams.set("city", city);
    if (stateId) url.searchParams.set("stateId", stateId);
    if (limit) url.searchParams.set("limit", String(limit));
    if (cursor) url.searchParams.set("cursor", cursor);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      return res
        .status(502)
        .send({ message: "Fleet owner service unavailable" });
    }
  }

  //  @Public()
  @Get("list")
  @ApiOperation({
    summary: "List fleetowners (admin/staff)",
    description: "List fleetowners via fleetowner-service.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "city", required: false })
  @ApiQuery({ name: "stateId", required: false })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["createdAt", "name", "email", "companyName", "status"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({ status: 200, description: "List of fleetowners" })
  async listFleetowners(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("stateId") stateId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const url = new URL(`${FLEETOWNER_SERVICE_URL}/fleetowners`);

    if (search) url.searchParams.set("search", search);
    if (status) url.searchParams.set("status", status);
    if (city) url.searchParams.set("city", city);
    if (stateId) url.searchParams.set("stateId", stateId);
    if (page) url.searchParams.set("page", String(page));
    if (limit) url.searchParams.set("limit", String(limit));
    if (sortBy) url.searchParams.set("sortBy", sortBy);
    if (sortOrder) url.searchParams.set("sortOrder", sortOrder);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      return res
        .status(502)
        .send({ message: "Fleet owner service unavailable" });
    }
  }
  @Get("export/data/:format")
  @ApiOperation({
    summary: "Export fleetowners data (admin → fleetowner-service)",
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
  async exportFleetowners(
    @Param("format") format: "csv" | "json" | "excel",
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("stateId") stateId?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;

    const url = new URL(
      `${FLEETOWNER_SERVICE_URL}/fleetowners/export/data/${format}`,
    );

    if (search) url.searchParams.set("search", search);
    if (status) url.searchParams.set("status", status);
    if (city) url.searchParams.set("city", city);
    if (stateId) url.searchParams.set("stateId", stateId);

    try {
      const response = await axios.get(url.toString(), {
        headers: {
          Authorization: authHeader ?? "",
        },
        responseType: "arraybuffer",
        validateStatus: () => true,
      });

      res.header("Content-Type", response.headers["content-type"]);
      res.header(
        "Content-Disposition",
        response.headers["content-disposition"],
      );

      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy EXPORT error:", err);
      return res
        .status(502)
        .send({ message: "Fleetowner service unavailable" });
    }
  }

  @Get("documents/:id/:docType")
  @ApiOperation({ summary: "Download a single fleetowner document" })
  @ApiParam({ name: "id", description: "Fleetowner UUID" })
  @ApiParam({
    name: "docType",
    description:
      "Document type (CANCELLED_CHEQUE, PANCARD, GST_CERTIFICATE, logo)",
  })
  @ApiResponse({ status: 200, description: "File streamed successfully" })
  @ApiResponse({ status: 404, description: "Document not found" })
  async getDocument(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Param("id") id: string,
    @Param("docType") docType: string,
  ) {
    try {
      // Proxy to fleetowner service
      const url = `${FLEETOWNER_SERVICE_URL}/fleetowners/documents/${id}/${docType}`;
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          Authorization: req.headers["authorization"] ?? "",
        },
        validateStatus: () => true,
      });

      // Forward headers and content
      res
        .header(
          "Content-Type",
          response.headers["content-type"] || "application/octet-stream",
        )
        .header(
          "Content-Disposition",
          response.headers["content-disposition"] ||
            `inline; filename="${docType}"`,
        )
        .status(response.status)
        .send(response.data);
    } catch (err) {
      console.error("Proxy error:", err);
      res.status(502).send({ message: "Fleetowner service unavailable" });
    }
  }
  @Get(":id")
  @ApiOperation({ summary: "Get fleetowner by ID" })
  @ApiParam({ name: "id", description: "Fleetowner ID (UUID)" })
  @ApiQuery({
    name: "includeDocuments",
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: "Fleetowner retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Fleetowner not found" })
  async getFleetowner(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("includeDocuments") includeDocuments?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const url = new URL(`${FLEETOWNER_SERVICE_URL}/fleetowners/${id}`);

    if (includeDocuments)
      url.searchParams.set("includeDocuments", includeDocuments);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      return res
        .status(502)
        .send({ message: "Fleetowner service unavailable" });
    }
  }
  @Patch("verify/:id")
  @ApiOperation({ summary: "Verify fleetowner (admin → fleetowner-service)" })
  @ApiParam({ name: "id", description: "Fleetowner UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiBody({ type: VerifyFleetownerDto })
  @ApiResponse({ status: 200, description: "Fleetowner verification updated" })
  async verifyFleetowner(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const adminId = req.headers["x-admin-id"] as string | undefined;

    const url = `${FLEETOWNER_SERVICE_URL}/fleetowners/verify/${id}`;

    try {
      const response = await axios.patch(url, body, {
        headers: {
          Authorization: authHeader ?? "",
          ...(adminId && { "x-admin-id": adminId }),
          "content-type": "application/json",
        },
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy VERIFY error:", err);
      return res
        .status(502)
        .send({ message: "Fleetowner service unavailable" });
    }
  }
  @Patch(":id")
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "id", description: "Fleetowner UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiBody({ type: UpdateFleetownerFormDto })
  @ApiOperation({
    summary: "Update fleetowner (admin → fleetowner-service)",
  })
  @ApiResponse({ status: 200, description: "Fleetowner updated successfully" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  async updateFleetowner(
    @Param("id") id: string,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const adminId = req.headers["x-admin-id"] as string | undefined;

    const url = `${FLEETOWNER_SERVICE_URL}/fleetowners/${id}`;

    try {
      const response = await axios.patch(url, req.raw, {
        headers: {
          Authorization: authHeader ?? "",
          "content-type": req.headers["content-type"],
          ...(adminId && { "x-admin-id": adminId }),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy PATCH error:", err);
      return res
        .status(502)
        .send({ message: "Fleetowner service unavailable" });
    }
  }
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete fleetowner (admin → fleetowner-service)" })
  @ApiParam({ name: "id", description: "Fleetowner UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiResponse({ status: 204, description: "Fleetowner deleted successfully" })
  @ApiResponse({ status: 404, description: "Fleetowner not found" })
  async deleteFleetowner(
    @Param("id") id: string,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const adminId = req.headers["x-admin-id"] as string | undefined;

    const url = `${FLEETOWNER_SERVICE_URL}/fleetowners/${id}`;

    try {
      const response = await axios.delete(url, {
        headers: {
          Authorization: authHeader ?? "",
          ...(adminId && { "x-admin-id": adminId }),
        },
        validateStatus: () => true,
      });

      // fleetowner returns 204 → no body
      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy DELETE error:", err);
      return res
        .status(502)
        .send({ message: "Fleetowner service unavailable" });
    }
  }

  //---------------------------- REVIEWS PROXY Fleet -----------------------------------
  @Get('reviews/received-cursor')
  @ApiOperation({
    summary: 'Get fleet reviews (cursor pagination, proxied)',
    description:
      'Keyset-paginated fleet reviews via driver-service. Pass meta.nextCursor as cursor.',
  })
  async getReceivedReviewsCursor(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query('fleetId') fleetId?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
    @Query('rating') rating?: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const driverUrl =
      process.env.DRIVER_SERVICE_URL ?? 'http://localhost:3004/api';

    if (!fleetId) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: 'fleetId is required',
      });
    }

    const url = new URL(`${driverUrl}/reviews/fleet/${fleetId}/cursor`);
    if (limit) url.searchParams.set('limit', String(limit));
    if (cursor) url.searchParams.set('cursor', cursor);
    if (typeof rating !== 'undefined' && rating !== null) {
      url.searchParams.set('rating', String(rating));
    }
    if (fromDate) url.searchParams.set('fromDate', fromDate);
    if (toDate) url.searchParams.set('toDate', toDate);

    try {
      const response = await axios.get(url.toString(), {
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error('Proxy DRIVER REVIEWS CURSOR error:', err);
      return res.status(HttpStatus.BAD_GATEWAY).send({
        message: 'Driver service unavailable',
      });
    }
  }

  @Get('reviews/received')
  @ApiOperation({ summary: 'Get all reviews for fleet dashboard (proxied)' })
  async getReceivedReviews(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query() query: FleetReviewsQueryDto,
  ) {
    const driverUrl = process.env.DRIVER_SERVICE_URL ?? 'http://localhost:3004/api';
    const fleetId = query.fleetId;

    if (!fleetId) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: 'fleetId is required'
      });
    }

    const url = new URL(`${driverUrl}/reviews/fleet/${fleetId}`);

    // Add optional query parameters only if provided
    if (query.page) url.searchParams.set('page', String(query.page));
    if (query.limit) url.searchParams.set('limit', String(query.limit));
    if (typeof query.rating !== 'undefined' && query.rating !== null)
      url.searchParams.set('rating', String(query.rating));
    if (query.fromDate) url.searchParams.set('fromDate', query.fromDate);
    if (query.toDate) url.searchParams.set('toDate', query.toDate);

    try {
      const response = await axios.get(url.toString(), {
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error('Proxy DRIVER REVIEWS error:', err);
      return res.status(HttpStatus.BAD_GATEWAY).send({
        message: 'Driver service unavailable'
      });
    }
  }
}
