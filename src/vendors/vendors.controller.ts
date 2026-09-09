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
import { CreateVendorDto } from "./dto/create-vendor.dto";
import { UpdateVendorFormDto } from "./dto/update-vendor.dto";
import { VerifyVendorDto } from "./dto/verify-vendor.dto";
import { FastifyReply } from "fastify";
import FormData from "form-data";
import { VendorsService } from "./vendors.service";

const VENDOR_SERVICE_URL =
  process.env.VENDOR_SERVICE_URL ?? "http://localhost:3002/api";

@ApiTags("vendors")
@ApiBearerAuth("JWT-auth")
@Controller("vendors")
@UseGuards(JwtAuthGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}
  @Post("create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create vendor (admin/staff)",
    description: "Create a new vendor via vendor-service.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: CreateVendorDto })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiResponse({ status: 201, description: "Vendor created successfully" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 409, description: "Vendor with email already exists" })
  async createVendor(@Req() req: any, @Res() res: FastifyReply) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const adminId = req.headers["x-admin-id"] as string | undefined;
    const url = `${VENDOR_SERVICE_URL}/vendors`;
    const contentType = req.headers["content-type"] ?? "";
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
      return res.status(502).send({ message: "Vendor service unavailable" });
    }
  }

  // Must be before @Get(":id")
  @Get("download")
  @ApiOperation({
    summary: "Download vendors as CSV",
    description:
      "Proxies a streamed CSV export from vendor-service. Supports the same filters as the vendors list.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "city", required: false })
  @ApiQuery({ name: "stateId", required: false })
  @ApiProduces("text/csv")
  @ApiResponse({ status: 200, description: "CSV file download" })
  async downloadCsv(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("stateId") stateId?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const url = new URL(`${VENDOR_SERVICE_URL}/vendors/download/csv`);

    if (search) url.searchParams.set("search", search);
    if (status) url.searchParams.set("status", status);
    if (city) url.searchParams.set("city", city);
    if (stateId) url.searchParams.set("stateId", stateId);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        responseType: "stream",
        timeout: 0,
        validateStatus: () => true,
      });

      const filename = `vendors_${new Date().toISOString().slice(0, 10)}.csv`;

      res
        .header("Content-Type", "text/csv; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .status(response.status);

      response.data.pipe(res.raw);
    } catch (err) {
      console.error("Proxy vendors CSV download error:", err);
      return res.status(502).send({ message: "Vendor service unavailable" });
    }
  }

  // Must be before @Get(":id")
  @Get("cursor")
  @ApiOperation({
    summary: "List vendors (cursor pagination) [deprecated path]",
    description:
      "DEPRECATED: prefer GET /web-admin/vendors/cursor. Requires Bearer JWT. " +
      "Keyset-paginated vendor list via vendor-service. Pass meta.nextCursor as cursor.",
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
  @ApiResponse({ status: 200, description: "Cursor-paginated vendors" })
  async listVendorsCursor(
    @Req() req: any,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("stateId") stateId?: string,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
  ) {
    return this.vendorsService.listVendorsCursor(
      (req.headers["authorization"] as string | undefined) ?? "",
      { search, status, city, stateId, limit, cursor },
    );
  }
  @Get("list")
  @ApiOperation({
    summary: "List vendors (admin/staff)",
    description: "List vendors via vendor-service.",
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
  @ApiResponse({ status: 200, description: "List of vendors" })
  async listVendors(
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
    const url = new URL(`${VENDOR_SERVICE_URL}/vendors`);

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
      return res.status(502).send({ message: "Vendor service unavailable" });
    }
  }
  @Get("export/data/:format")
  @ApiOperation({ summary: "Export vendors data (admin → vendor-service)" })
  @ApiParam({ name: "format", enum: ["csv", "json", "excel"] })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "city", required: false })
  @ApiQuery({ name: "stateId", required: false })
  @ApiProduces(
    "application/octet-stream",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  )
  async exportVendors(
    @Param("format") format: "csv" | "json" | "excel",
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("stateId") stateId?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;

    const url = new URL(`${VENDOR_SERVICE_URL}/vendors/export/data/${format}`);

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
      return res.status(502).send({ message: "Vendor service unavailable" });
    }
  }

  @Get("documents/:id/:docType")
  @ApiOperation({ summary: "Download a single vendor document" })
  @ApiParam({ name: "id", description: "Vendor UUID" })
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
      // Proxy to vendor service
      const url = `${VENDOR_SERVICE_URL}/vendors/documents/${id}/${docType}`;
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
      res.status(502).send({ message: "Vendor service unavailable" });
    }
  }
  @Get(":id")
  @ApiOperation({ summary: "Get vendor by ID" })
  @ApiParam({ name: "id", description: "Vendor ID (UUID)" })
  @ApiQuery({
    name: "includeDocuments",
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiResponse({ status: 200, description: "Vendor retrieved successfully" })
  @ApiResponse({ status: 404, description: "Vendor not found" })
  async getVendor(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("includeDocuments") includeDocuments?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const url = new URL(`${VENDOR_SERVICE_URL}/vendors/${id}`);

    if (includeDocuments)
      url.searchParams.set("includeDocuments", includeDocuments);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      return res.status(502).send({ message: "Vendor service unavailable" });
    }
  }
  @Patch("verify/:id")
  @ApiOperation({ summary: "Verify vendor (admin → vendor-service)" })
  @ApiParam({ name: "id", description: "Vendor UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiBody({ type: VerifyVendorDto })
  @ApiResponse({ status: 200, description: "Vendor verification updated" })
  async verifyVendor(
    @Param("id") id: string,
    @Body() body: any, // or VerifyVendorDto (swagger only)
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const adminId = req.headers["x-admin-id"] as string | undefined;

    const url = `${VENDOR_SERVICE_URL}/vendors/verify/${id}`;

    try {
      const response = await axios.patch(url, body, {
        headers: {
          Authorization: authHeader ?? "",
          ...(adminId && { "x-admin-id": adminId }),
          "content-type": "application/json", // ✅ important
        },
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy VERIFY error:", err);
      return res.status(502).send({ message: "Vendor service unavailable" });
    }
  }


  @Patch(":id/approval-status")
@ApiOperation({ summary: "Update vendor approval status (admin → vendor-service)" })
@ApiParam({ name: "id", description: "Vendor UUID" })
@ApiHeader({ name: "x-admin-id", required: false })
@ApiBody({
  schema: {
    type: "object",
    properties: {
      isApproved: { type: "boolean" },
    },
    required: ["isApproved"],
  },
})
@ApiResponse({ status: 200, description: "Vendor approval status updated" })
@ApiResponse({ status: 404, description: "Vendor not found" })
async updateVendorApprovalStatus(
  @Param("id") id: string,
  @Body() body: any,
  @Req() req: any,
  @Res() res: FastifyReply,
) {
  const authHeader = req.headers["authorization"] as string | undefined;
  const adminId = req.headers["x-admin-id"] as string | undefined;

  const url = `${VENDOR_SERVICE_URL}/vendors/${id}/approval-status`;

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
    console.error("Proxy APPROVAL STATUS error:", err);
    return res.status(502).send({ message: "Vendor service unavailable" });
  }
}

  @Patch(":id")
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "id", description: "Vendor UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiBody({ type: UpdateVendorFormDto })
  @ApiOperation({
    summary: "Update vendor (admin → vendor-service)",
  })
  @ApiResponse({ status: 200, description: "Vendor updated successfully" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  async updateVendor(
    @Param("id") id: string,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const adminId = req.headers["x-admin-id"] as string | undefined;

    const url = `${VENDOR_SERVICE_URL}/vendors/${id}`;

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
      return res.status(502).send({ message: "Vendor service unavailable" });
    }
  }
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete vendor (admin → vendor-service)" })
  @ApiParam({ name: "id", description: "Vendor UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiResponse({ status: 204, description: "Vendor deleted successfully" })
  @ApiResponse({ status: 404, description: "Vendor not found" })
  async deleteVendor(
    @Param("id") id: string,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const adminId = req.headers["x-admin-id"] as string | undefined;

    const url = `${VENDOR_SERVICE_URL}/vendors/${id}`;

    try {
      const response = await axios.delete(url, {
        headers: {
          Authorization: authHeader ?? "",
          ...(adminId && { "x-admin-id": adminId }),
        },
        validateStatus: () => true,
      });

      // vendor returns 204 → no body
      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy DELETE error:", err);
      return res.status(502).send({ message: "Vendor service unavailable" });
    }
  }
}
