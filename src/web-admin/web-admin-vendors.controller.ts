import {
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
import { VendorsService } from "../vendors/vendors.service";
import { WalletService } from "../wallet/wallet.service";
import { CreateVendorDto } from "../vendors/dto/create-vendor.dto";
import { UpdateVendorFormDto } from "../vendors/dto/update-vendor.dto";

const VENDOR_SERVICE_URL =
  process.env.VENDOR_SERVICE_URL ?? "http://localhost:3002/api";

@ApiTags("web-admin")
@ApiBearerAuth("JWT-auth")
@Controller("web-admin/vendors")
export class WebAdminVendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly walletService: WalletService,
  ) {}

  private authHeader(req: FastifyRequest): string {
    return (req.headers["authorization"] as string | undefined) ?? "";
  }

  @Get("list")
  @ApiOperation({
    summary: "Web admin: list vendors (JWT)",
    description: "Legacy: GET /vendors/list.",
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
  listVendors(
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
    return this.vendorsService.listVendors(this.authHeader(req), {
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

  @Post("create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Web admin: create vendor (JWT + multipart)",
    description: "Legacy: POST /vendors/create.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: CreateVendorDto })
  @ApiHeader({ name: "x-admin-id", required: false })
  async createVendor(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    // const adminId = req.headers["x-admin-id"] as string | undefined;
    const adminId = (req.headers["x-admin-id"] as string | undefined) ?? req.user?.id;
    const result = await this.vendorsService.proxyMultipartPost(
      `${VENDOR_SERVICE_URL}/vendors`,
      req,
      this.authHeader(req),
      adminId,
    );
    return res.status(result.status).send(result.data);
  }

  @Get("download")
  @ApiOperation({
    summary: "Web admin: download vendors CSV (JWT)",
    description: "Legacy: GET /vendors/download.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "city", required: false })
  @ApiQuery({ name: "stateId", required: false })
  @ApiProduces("text/csv")
  downloadCsv(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("stateId") stateId?: string,
  ) {
    return this.vendorsService.downloadCsv(this.authHeader(req), res, {
      search,
      status,
      city,
      stateId,
    });
  }

  // ── Wallet / transactions (static segments before bare :id) ───────────────

  @Get(":vendorId/summary")
  @ApiOperation({
    summary: "Web admin: vendor wallet summary (JWT)",
    description: "Legacy: GET /admin/vendors/:vendorId/summary.",
  })
  @ApiParam({ name: "vendorId", type: String })
  getVendorSummary(
    @Param("vendorId") vendorId: string,
    @Req() req: FastifyRequest,
  ) {
    return this.walletService.getVendorSummary(
      vendorId,
      this.authHeader(req),
    );
  }

  @Post(":vendorId/wallet/add-money")
  @ApiOperation({
    summary: "Web admin: credit vendor wallet (JWT)",
    description: "Legacy: POST /admin/vendors/:vendorId/wallet/add-money.",
  })
  @ApiParam({ name: "vendorId", type: String })
  @ApiBody({
    schema: {
      type: "object",
      required: ["amount"],
      properties: {
        amount: { type: "number", example: 1000, minimum: 1 },
        payment_method: { type: "string", example: "Admin" },
        notes: { type: "string", example: "Manual top-up" },
      },
    },
  })
  adminAddVendorMoney(
    @Param("vendorId") vendorId: string,
    @Body() body: { amount: number; payment_method?: string; notes?: string },
    @Req() req: FastifyRequest,
  ) {
    return this.walletService.adminAddVendorMoney(
      vendorId,
      this.authHeader(req),
      body,
    );
  }

  @Get(":vendorId/transactions-cursor")
  @ApiOperation({
    summary: "Web admin: vendor transactions cursor (JWT)",
    description: "Legacy: GET /admin/vendors/:vendorId/transactions-cursor.",
  })
  @ApiParam({ name: "vendorId", type: String })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "payment_method", required: false })
  @ApiQuery({ name: "from_date", required: false })
  @ApiQuery({ name: "to_date", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false })
  getVendorTransactionsCursor(
    @Param("vendorId") vendorId: string,
    @Req() req: FastifyRequest,
    @Query("type") type?: string,
    @Query("search") search?: string,
    @Query("payment_method") payment_method?: string,
    @Query("from_date") from_date?: string,
    @Query("to_date") to_date?: string,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
  ) {
    return this.walletService.getVendorTransactionsCursor(
      vendorId,
      this.authHeader(req),
      { type, search, payment_method, from_date, to_date, limit, cursor },
    );
  }

  @Get(":vendorId/transactions/download")
  @ApiOperation({
    summary: "Web admin: download vendor transactions CSV (JWT)",
    description: "Legacy: GET /admin/vendors/:vendorId/transactions/download.",
  })
  @ApiParam({ name: "vendorId", type: String })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "payment_method", required: false })
  @ApiQuery({ name: "from_date", required: false })
  @ApiQuery({ name: "to_date", required: false })
  @ApiProduces("text/csv")
  async downloadVendorTransactions(
    @Param("vendorId") vendorId: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query("type") type?: string,
    @Query("search") search?: string,
    @Query("payment_method") payment_method?: string,
    @Query("from_date") from_date?: string,
    @Query("to_date") to_date?: string,
  ) {
    const result = await this.walletService.downloadVendorTransactions(
      vendorId,
      this.authHeader(req),
      { type, search, payment_method, from_date, to_date },
    );
    res.header("Content-Type", result.contentType);
    res.header(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );
    return res.send(result.data);
  }

  @Get(":vendorId/transactions")
  @ApiOperation({
    summary: "Web admin: vendor transactions (offset) (JWT)",
    description: "Legacy: GET /admin/vendors/:vendorId/transactions.",
  })
  @ApiParam({ name: "vendorId", type: String })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "payment_method", required: false })
  @ApiQuery({ name: "from_date", required: false })
  @ApiQuery({ name: "to_date", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  getVendorTransactions(
    @Param("vendorId") vendorId: string,
    @Req() req: FastifyRequest,
    @Query("type") type?: string,
    @Query("search") search?: string,
    @Query("payment_method") payment_method?: string,
    @Query("from_date") from_date?: string,
    @Query("to_date") to_date?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.walletService.getVendorTransactions(
      vendorId,
      this.authHeader(req),
      { type, search, payment_method, from_date, to_date, page, limit },
    );
  }

  @Get(":id")
  @ApiOperation({
    summary: "Web admin: get vendor by ID (JWT)",
    description: "Legacy: GET /vendors/:id.",
  })
  @ApiParam({ name: "id", description: "Vendor ID (UUID)" })
  @ApiQuery({ name: "includeDocuments", required: false, type: Boolean })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getVendor(
    @Req() req: FastifyRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("includeDocuments") includeDocuments?: string,
  ) {
    return this.vendorsService.getVendor(
      this.authHeader(req),
      id,
      includeDocuments,
    );
  }

    @Patch(":id/approval-status")
  @ApiOperation({
    summary: "Web admin: update vendor approval status (JWT)",
    description: "Legacy: PATCH /vendors/:id/approval-status.",
  })
  @ApiParam({ name: "id", description: "Vendor UUID" })
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
  updateApprovalStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("isApproved") isApproved: boolean,
    @Req() req: FastifyRequest,
  ) {
    return this.vendorsService.updateApprovalStatus(
      this.authHeader(req),
      id,
      isApproved,
    );
  }

  @Patch(":id")
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "id", description: "Vendor UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiBody({ type: UpdateVendorFormDto })
  @ApiOperation({
    summary: "Web admin: update vendor (JWT + multipart)",
    description: "Legacy: PATCH /vendors/:id.",
  })
  async updateVendor(
    @Param("id") id: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    // const adminId = req.headers["x-admin-id"] as string | undefined;
    const adminId = (req.headers["x-admin-id"] as string | undefined) ?? req.user?.id;
    const result = await this.vendorsService.proxyMultipartPatch(
      `${VENDOR_SERVICE_URL}/vendors/${id}`,
      req,
      this.authHeader(req),
      adminId,
      id,
    );
    return res.status(result.status).send(result.data);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Web admin: soft-delete vendor (JWT)",
    description: "Legacy: DELETE /vendors/:id. Soft-deletes in vendor-service.",
  })
  @ApiParam({ name: "id", description: "Vendor UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  async deleteVendor(
    @Param("id") id: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    // const adminId = req.headers["x-admin-id"] as string | undefined;
    const adminId = (req.headers["x-admin-id"] as string | undefined) ?? req.user?.id;
    const result = await this.vendorsService.deleteVendor(
      this.authHeader(req),
      id,
      adminId,
    );
    return res.status(result.status || HttpStatus.NO_CONTENT).send();
  }
}
