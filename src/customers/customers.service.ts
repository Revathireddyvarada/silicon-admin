import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { FastifyReply } from "fastify";
import { UpdateCustomerStatusDto } from "./dto/update-customer-status.dto";

const CUSTOMER_SERVICE_URL =
  process.env.CUSTOMER_SERVICE_URL ?? "http://localhost:3005/api";

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  private throwOnError(response: { status: number; data: unknown }): void {
    if (response.status >= 400) {
      throw new HttpException(
        response.data ?? { message: "Customer service error" },
        response.status,
      );
    }
  }

  async list(
    authHeader: string,
    query: {
      search?: string;
      status?: string;
      location?: string;
      gender?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
    },
  ): Promise<any> {
    const url = new URL(`${CUSTOMER_SERVICE_URL}/customers`);
    if (query.search) url.searchParams.set("search", query.search);
    if (query.status) url.searchParams.set("status", query.status);
    if (query.location) url.searchParams.set("location", query.location);
    if (query.gender) url.searchParams.set("gender", query.gender);
    if (query.page) url.searchParams.set("page", String(query.page));
    if (query.limit) url.searchParams.set("limit", String(query.limit));
    if (query.sortBy) url.searchParams.set("sortBy", query.sortBy);
    if (query.sortOrder) url.searchParams.set("sortOrder", query.sortOrder);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        validateStatus: () => true,
      });
      this.throwOnError(response);
      return response.data;
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Customer service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async counts(authHeader: string): Promise<any> {
    const url = `${CUSTOMER_SERVICE_URL}/customers/counts`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: authHeader ?? "" },
        validateStatus: () => true,
      });
      this.throwOnError(response);
      return response.data;
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Customer service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getById(authHeader: string, id: string): Promise<any> {
    const url = `${CUSTOMER_SERVICE_URL}/customers/${id}`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: authHeader ?? "" },
        validateStatus: () => true,
      });
      this.throwOnError(response);
      return response.data;
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Customer service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async updateStatus(
    authHeader: string,
    id: string,
    body: UpdateCustomerStatusDto,
    adminId?: string,
  ): Promise<any> {
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
      this.throwOnError(response);
      return response.data;
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Customer service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async delete(
    authHeader: string,
    id: string,
    adminId?: string,
  ): Promise<any> {
    const url = `${CUSTOMER_SERVICE_URL}/customers/${id}`;
    try {
      const response = await axios.delete(url, {
        headers: {
          Authorization: authHeader ?? "",
          ...(adminId && { "x-admin-id": adminId }),
        },
        validateStatus: () => true,
      });
      this.throwOnError(response);
      return response.data;
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Customer service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async downloadCsv(
    authHeader: string,
    res: FastifyReply,
    query: {
      search?: string;
      status?: string;
      location?: string;
      gender?: string;
    },
  ): Promise<void> {
    const url = new URL(`${CUSTOMER_SERVICE_URL}/customers/download/csv`);
    if (query.search) url.searchParams.set("search", query.search);
    if (query.status) url.searchParams.set("status", query.status);
    if (query.location) url.searchParams.set("location", query.location);
    if (query.gender) url.searchParams.set("gender", query.gender);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        responseType: "stream",
        validateStatus: () => true,
      });

      if (response.status >= 400) {
        throw new HttpException(
          response.data ?? { message: "Customer service error" },
          response.status,
        );
      }

      const filename = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
      res
        .header("Content-Type", "text/csv; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .status(response.status);

      response.data.pipe(res.raw);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Customer service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
