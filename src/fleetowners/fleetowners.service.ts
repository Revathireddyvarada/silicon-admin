import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { FastifyReply } from "fastify";

const FLEETOWNER_SERVICE_URL =
  process.env.FLEETOWNER_SERVICE_URL ?? "http://localhost:3003/api";

@Injectable()
export class FleetownersService {
  private readonly logger = new Logger(FleetownersService.name);

  private throwOnError(response: { status: number; data: unknown }): void {
    if (response.status >= 400) {
      throw new HttpException(
        response.data ?? { message: "Fleetowner service error" },
        response.status,
      );
    }
  }

  async list(
    authHeader: string,
    query: {
      search?: string;
      status?: string;
      city?: string;
      stateId?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
    },
  ): Promise<any> {
    const url = new URL(`${FLEETOWNER_SERVICE_URL}/fleetowners`);
    if (query.search) url.searchParams.set("search", query.search);
    if (query.status) url.searchParams.set("status", query.status);
    if (query.city) url.searchParams.set("city", query.city);
    if (query.stateId) url.searchParams.set("stateId", query.stateId);
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
        "Fleet owner service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async cursor(
    authHeader: string,
    query: {
      search?: string;
      status?: string;
      city?: string;
      cityId?: string;
      cityName?: string;
      stateId?: string;
      limit?: number;
      cursor?: string;
    },
  ): Promise<any> {
    const url = new URL(`${FLEETOWNER_SERVICE_URL}/fleetowners/cursor`);
    if (query.search) url.searchParams.set("search", query.search);
    if (query.status) url.searchParams.set("status", query.status);
    if (query.city) url.searchParams.set("city", query.city);
    if (query.cityId) url.searchParams.set("cityId", query.cityId);
    if (query.cityName) url.searchParams.set("cityName", query.cityName);
    if (query.stateId) url.searchParams.set("stateId", query.stateId);
    if (query.limit) url.searchParams.set("limit", String(query.limit));
    if (query.cursor) url.searchParams.set("cursor", query.cursor);

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
        "Fleet owner service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getById(
    authHeader: string,
    id: string,
    includeDocuments?: string,
  ): Promise<any> {
    const url = new URL(`${FLEETOWNER_SERVICE_URL}/fleetowners/${id}`);
    if (includeDocuments) {
      url.searchParams.set("includeDocuments", includeDocuments);
    }

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
        "Fleetowner service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async delete(
    authHeader: string,
    id: string,
    adminId?: string,
  ): Promise<any> {
    const url = `${FLEETOWNER_SERVICE_URL}/fleetowners/${id}`;
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
        "Fleetowner service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async exportData(
    authHeader: string,
    res: FastifyReply,
    format: "csv" | "json" | "excel",
    query: {
      search?: string;
      status?: string;
      city?: string;
      stateId?: string;
    },
  ): Promise<void> {
    const url = new URL(
      `${FLEETOWNER_SERVICE_URL}/fleetowners/export/data/${format}`,
    );
    if (query.search) url.searchParams.set("search", query.search);
    if (query.status) url.searchParams.set("status", query.status);
    if (query.city) url.searchParams.set("city", query.city);
    if (query.stateId) url.searchParams.set("stateId", query.stateId);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        responseType: "arraybuffer",
        validateStatus: () => true,
      });

      if (response.status >= 400) {
        throw new HttpException(
          response.data ?? { message: "Fleetowner service error" },
          response.status,
        );
      }

      res.header("Content-Type", response.headers["content-type"]);
      res.header(
        "Content-Disposition",
        response.headers["content-disposition"],
      );
      res.status(response.status).send(response.data);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Fleetowner service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async proxyMultipartPost(
    url: string,
    req: any,
    authHeader: string,
    adminId?: string,
  ): Promise<{ status: number; data: unknown }> {
    try {
      const response = await axios.post(url, req.raw, {
        headers: {
          Authorization: authHeader ?? "",
          "content-type": req.headers["content-type"],
          "x-admin-id": adminId ?? null,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
      });
      if (response.status >= 400) {
        throw new HttpException(
          response.data ?? { message: "Fleetowner service error" },
          response.status,
        );
      }
      return { status: response.status, data: response.data };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Fleet owner service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async proxyMultipartPatch(
    url: string,
    req: any,
    authHeader: string,
    adminId?: string,
  ): Promise<{ status: number; data: unknown }> {
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
      if (response.status >= 400) {
        throw new HttpException(
          response.data ?? { message: "Fleetowner service error" },
          response.status,
        );
      }
      return { status: response.status, data: response.data };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Fleetowner service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
