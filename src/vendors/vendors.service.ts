import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { FastifyReply } from "fastify";
import { ActivityLogService } from "../activity-log/activity-log.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";


const ACTION_VERB: Record<"CREATE" | "EDIT" | "DELETE", string> = {
  CREATE: "created",
  EDIT: "updated",
  DELETE: "deleted",
};


const VENDOR_SERVICE_URL =
  process.env.VENDOR_SERVICE_URL ?? "http://localhost:3002/api";

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);
  // constructor(private readonly activityLogService: ActivityLogService) {}

  constructor(
  private readonly activityLogService: ActivityLogService,
  @InjectRepository(User)
  private readonly userRepo: Repository<User>,
) {}


  logVendorActivity(
  action: "CREATE" | "EDIT" | "DELETE",
  vendorName: string,
  vendorId?: string,
  adminId?: string,
): void {
  const idSuffix = vendorId ? ` (${vendorId})` : "";
  this.resolveActorName(adminId)
    .then((actorName) =>
      this.activityLogService.log(
        {
          action,
            description: `${actorName} ${ACTION_VERB[action]} Vendor ${vendorName}${idSuffix}.`,
            modelName: "Vendor",
        },
        adminId ?? undefined,
      ),
    )
    .catch((err) =>
      this.logger.warn(`Failed to write vendor activity log: ${err?.message}`),
    );
}

  private async resolveActorName(adminId?: string): Promise<string> {
  if (!adminId) return "System";
  try {
    const user = await this.userRepo.findOne({
      where: { id: adminId },
      select: ["id", "firstName", "lastName"],
    });
    if (!user) return "Admin";
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return name || "Admin";
  } catch (err: any) {
    this.logger.warn(`Failed to resolve actor name for ${adminId}: ${err?.message}`);
    return "Admin";
  }
}

  private throwOnError(response: { status: number; data: unknown }): void {
    if (response.status >= 400) {
      throw new HttpException(
        response.data ?? { message: "Vendor service error" },
        response.status,
      );
    }
  }

  async listVendorsCursor(
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
    const url = new URL(`${VENDOR_SERVICE_URL}/vendors/cursor`);
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
        "Vendor service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async listVendors(
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
    const url = new URL(`${VENDOR_SERVICE_URL}/vendors`);
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
        "Vendor service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getVendor(
    authHeader: string,
    id: string,
    includeDocuments?: string,
  ): Promise<any> {
    const url = new URL(`${VENDOR_SERVICE_URL}/vendors/${id}`);
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
        "Vendor service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }


    async updateApprovalStatus(
    authHeader: string,
    id: string,
    isApproved: boolean,
  ): Promise<any> {
    const url = `${VENDOR_SERVICE_URL}/vendors/${id}/approval-status`;

    try {
      const response = await axios.patch(
        url,
        { isApproved },
        {
          headers: {
            Authorization: authHeader ?? "",
            "content-type": "application/json",
          },
          validateStatus: () => true,
        },
      );
      this.throwOnError(response);
      return response.data;
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Vendor service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async deleteVendor(
    authHeader: string,
    id: string,
    adminId?: string,
  ): Promise<{ status: number }> {
    const url = `${VENDOR_SERVICE_URL}/vendors/${id}`;

    let vendorName = id;
    let vendorIdLabel: string | undefined;

    try {
      const response = await this.getVendor(authHeader, id);
      const vendor = response?.data;

      vendorName =
      vendor?.name ??
      vendor?.companyName ??
      id;
      vendorIdLabel = vendor?.vendor_id;

    } catch {
    // fall back to id — never block the delete on a lookup failure
    }

    try {
      const response = await axios.delete(url, {
        headers: {
          Authorization: authHeader ?? "",
          ...(adminId && { "x-admin-id": adminId }),
        },
        validateStatus: () => true,
      });
      this.throwOnError(response);
      this.logVendorActivity("DELETE", vendorName, vendorIdLabel, adminId);
      return { status: response.status || HttpStatus.NO_CONTENT };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Vendor service unavailable",
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
      city?: string;
      stateId?: string;
    },
  ): Promise<void> {
    const url = new URL(`${VENDOR_SERVICE_URL}/vendors/download/csv`);
    if (query.search) url.searchParams.set("search", query.search);
    if (query.status) url.searchParams.set("status", query.status);
    if (query.city) url.searchParams.set("city", query.city);
    if (query.stateId) url.searchParams.set("stateId", query.stateId);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? "" },
        responseType: "stream",
        timeout: 0,
        validateStatus: () => true,
      });

      if (response.status >= 400) {
        throw new HttpException(
          response.data ?? { message: "Vendor service error" },
          response.status,
        );
      }

      const filename = `vendors_${new Date().toISOString().slice(0, 10)}.csv`;
      res
        .header("Content-Type", "text/csv; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .status(response.status);

      response.data.pipe(res.raw);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Vendor service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Multipart create/update stay proxied via req.raw (same as VendorsController).
   */
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
          response.data ?? { message: "Vendor service error" },
          response.status,
        );
      }
      const vendor = response.data?.data;
      this.logVendorActivity(
      "CREATE",
      vendor?.name ?? vendor?.companyName ?? vendor?.id ?? "Unknown",
      vendor?.vendor_id,
      adminId,
      );
      return { status: response.status, data: response.data };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Vendor service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async proxyMultipartPatch(
    url: string,
    req: any,
    authHeader: string,
    adminId?: string,
    id?: string,
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
          response.data ?? { message: "Vendor service error" },
          response.status,
        );
      }
      const vendor = response.data?.data;
      this.logVendorActivity(
      "EDIT",
      vendor?.name ?? vendor?.companyName ?? id ?? "Unknown",
      vendor?.vendor_id,
      adminId,
      );
      return { status: response.status, data: response.data };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message || err);
      throw new HttpException(
        "Vendor service unavailable",
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
