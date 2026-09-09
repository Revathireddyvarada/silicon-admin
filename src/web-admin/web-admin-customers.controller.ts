import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Body,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { FastifyReply, FastifyRequest } from "fastify";
import { CustomersService } from "../customers/customers.service";
import { UpdateCustomerStatusDto } from "../customers/dto/update-customer-status.dto";

@ApiTags("web-admin")
@ApiBearerAuth("JWT-auth")
@Controller("web-admin/customers")
export class WebAdminCustomersController {
  constructor(private readonly customersService: CustomersService) {}

  private authHeader(req: FastifyRequest): string {
    return (req.headers["authorization"] as string | undefined) ?? "";
  }

  @Get("list")
  @ApiOperation({
    summary: "Web admin: list customers (JWT)",
    description: "Legacy: GET /customers/list.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["ACTIVE", "INACTIVE", "BLOCKED", "SUSPENDED"],
  })
  @ApiQuery({ name: "location", required: false })
  @ApiQuery({ name: "gender", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["createdAt", "name", "email", "mobileNumber", "status"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  listCustomers(
    @Req() req: FastifyRequest,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("location") location?: string,
    @Query("gender") gender?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    return this.customersService.list(this.authHeader(req), {
      search,
      status,
      location,
      gender,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get("download")
  @ApiOperation({
    summary: "Web admin: download customers CSV (JWT)",
    description: "Legacy: GET /customers/download.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["ACTIVE", "INACTIVE", "BLOCKED", "SUSPENDED"],
  })
  @ApiQuery({ name: "location", required: false })
  @ApiQuery({ name: "gender", required: false })
  @ApiProduces("text/csv")
  downloadCsv(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("location") location?: string,
    @Query("gender") gender?: string,
  ) {
    return this.customersService.downloadCsv(this.authHeader(req), res, {
      search,
      status,
      location,
      gender,
    });
  }

  @Get("counts")
  @ApiOperation({
    summary: "Web admin: customer counts by status (JWT)",
    description: "Legacy: GET /customers/counts.",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getCustomerCounts(@Req() req: FastifyRequest) {
    return this.customersService.counts(this.authHeader(req));
  }

  @Patch(":id/status")
  @ApiOperation({
    summary: "Web admin: update customer status (JWT)",
    description: "Legacy: PATCH /customers/customers/:id/status.",
  })
  @ApiParam({ name: "id", description: "Customer UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiBody({ type: UpdateCustomerStatusDto })
  updateCustomerStatus(
    @Param("id") id: string,
    @Body() body: UpdateCustomerStatusDto,
    @Req() req: FastifyRequest,
  ) {
    const adminId = req.headers["x-admin-id"] as string | undefined;
    return this.customersService.updateStatus(
      this.authHeader(req),
      id,
      body,
      adminId,
    );
  }

  @Get(":id")
  @ApiOperation({
    summary: "Web admin: get customer by ID (JWT)",
    description: "Legacy: GET /customers/:id.",
  })
  @ApiParam({ name: "id", description: "Customer ID (UUID)" })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT." })
  getCustomer(
    @Req() req: FastifyRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.customersService.getById(this.authHeader(req), id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Web admin: delete customer (JWT)",
    description: "Legacy: DELETE /customers/:id.",
  })
  @ApiParam({ name: "id", description: "Customer UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  deleteCustomer(@Param("id") id: string, @Req() req: FastifyRequest) {
    const adminId = req.headers["x-admin-id"] as string | undefined;
    return this.customersService.delete(this.authHeader(req), id, adminId);
  }
}
