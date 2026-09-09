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
import { UpdateCustomerStatusDto } from "./dto/update-customer-status.dto";
import { FastifyReply } from "fastify";

const CUSTOMER_SERVICE_URL =
  process.env.CUSTOMER_SERVICE_URL ?? "http://localhost:3005/api";

@ApiTags("customers")
@ApiBearerAuth("JWT-auth")
@Controller("customers")
@UseGuards(JwtAuthGuard)
export class CustomersController {
  @Get("list")
  @ApiOperation({
    summary: "List customers (admin/staff)",
    description: "List customers via customer-service.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["ACTIVE", "INACTIVE", "BLOCKED", "SUSPENDED"],
  })
  @ApiQuery({ name: "location", required: false })
  @ApiQuery({ name: "gender", required: false })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["createdAt", "name", "email", "mobileNumber", "status"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({ status: 200, description: "List of customers" })
  async listCustomers(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("location") location?: string,
    @Query("gender") gender?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const url = new URL(`${CUSTOMER_SERVICE_URL}/customers`);

    if (search) url.searchParams.set("search", search);
    if (status) url.searchParams.set("status", status);
    if (location) url.searchParams.set("location", location);
    if (gender) url.searchParams.set("gender", gender);
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
      return res.status(502).send({ message: "Customer service unavailable" });
    }
  }
  @Get("download")
  @ApiOperation({ summary: "Download customers as CSV" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["ACTIVE", "INACTIVE", "BLOCKED", "SUSPENDED"],
  })
  @ApiQuery({ name: "location", required: false })
  @ApiQuery({ name: "gender", required: false })
  @ApiProduces("text/csv")
  @ApiResponse({ status: 200, description: "CSV file download" })
  async downloadCsv(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("location") location?: string,
    @Query("gender") gender?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const url = new URL(`${CUSTOMER_SERVICE_URL}/customers/download/csv`);

    if (search) url.searchParams.set("search", search);
    if (status) url.searchParams.set("status", status);
    if (location) url.searchParams.set("location", location);
    if (gender) url.searchParams.set("gender", gender);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        responseType: "stream", // ← stream the CSV through
        validateStatus: () => true,
      });

      const filename = `customers_${new Date().toISOString().slice(0, 10)}.csv`;

      res
        .header("Content-Type", "text/csv; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .status(response.status);

      response.data.pipe(res.raw); // ← pipe stream directly to Fastify raw response
    } catch (err) {
      console.error("Proxy CSV download error:", err);
      return res.status(502).send({ message: "Customer service unavailable" });
    }
  }
  @Get("counts")
  @ApiOperation({
    summary: "Get customer counts by status (admin → customer-service)",
  })
  @ApiResponse({ status: 200, description: "Customer counts" })
  async getCustomerCounts(@Req() req: any, @Res() res: FastifyReply) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const url = `${CUSTOMER_SERVICE_URL}/customers/counts`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: authHeader ?? "" },
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy CUSTOMER COUNTS error:", err);
      return res.status(502).send({ message: "Customer service unavailable" });
    }
  }
  @Get(":id")
  @ApiOperation({ summary: "Get customer by ID" })
  @ApiParam({ name: "id", description: "Customer ID (UUID)" })
  @ApiResponse({ status: 200, description: "Customer retrieved successfully" })
  @ApiResponse({ status: 404, description: "Customer not found" })
  async getCustomer(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const url = new URL(`${CUSTOMER_SERVICE_URL}/customers/${id}`);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        validateStatus: () => true,
      });

      return res.status(response.status).send(response.data);
    } catch (err) {
      return res.status(502).send({ message: "Customer service unavailable" });
    }
  }
  @Patch("customers/:id/status")
  @ApiOperation({
    summary: "Update customer status (admin → customer-service)",
  })
  @ApiParam({ name: "id", description: "Customer UUID" })
  @ApiHeader({ name: "x-admin-id", required: false })
  @ApiBody({ type: UpdateCustomerStatusDto })
  @ApiResponse({ status: 200, description: "Customer status updated" })
  async updateCustomerStatus(
    @Param("id") id: string,
    @Body() body: UpdateCustomerStatusDto,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const adminId = req.headers["x-admin-id"] as string | undefined;

    const url = `${CUSTOMER_SERVICE_URL}/customers/${id}/status`;

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
      console.error("Proxy CUSTOMER STATUS error:", err);
      return res.status(502).send({ message: "Customer service unavailable" });
    }
  }
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete customer" })
  @ApiParam({ name: "id", description: "Customer UUID" })
  @ApiResponse({ status: 204, description: "Customer deleted successfully" })
  @ApiResponse({ status: 404, description: "Customer not found" })
  async deleteCustomer(
    @Param("id") id: string,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const adminId = req.headers["x-admin-id"] as string | undefined;

    const url = `${CUSTOMER_SERVICE_URL}/customers/${id}`;

    try {
      const response = await axios.delete(url, {
        headers: {
          Authorization: authHeader ?? "",
          ...(adminId && { "x-admin-id": adminId }),
        },
        validateStatus: () => true,
      });

      // returns 204 → no body
      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy DELETE error:", err);
      return res.status(502).send({ message: "Customer service unavailable" });
    }
  }
}
