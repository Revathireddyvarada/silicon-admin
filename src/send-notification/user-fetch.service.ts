import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export interface RemoteUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  userType: string;
}

@Injectable()
export class UserFetchService {
  private readonly logger = new Logger(UserFetchService.name);

  private readonly serviceUrls: Record<string, string> = {
    vendors: process.env.VENDOR_SERVICE_URL!,
    drivers: process.env.DRIVER_SERVICE_URL!,
    fleet_owners: process.env.FLEETOWNER_SERVICE_URL!,
    b2c_customers: process.env.CUSTOMER_SERVICE_URL!,
  };

  private readonly servicePaths: Record<string, string> = {
    vendors: "vendors",
    drivers: "drivers",
    fleet_owners: "fleetowners",
    b2c_customers: "customers",
  };

  constructor(private readonly http: HttpService) {}

  private getBaseUrl(userType: string): string | null {
    const raw = this.serviceUrls[userType];
    if (!raw) return null;
    return raw.replace(/\/$/, "");
  }

  async fetchByIds(userType: string, ids: string[]): Promise<RemoteUser[]> {
    const baseUrl = this.getBaseUrl(userType);
    const path = this.servicePaths[userType];

    if (!baseUrl || !path) {
      this.logger.warn(`No service URL configured for userType=${userType}`);
      return [];
    }

    const url = `${baseUrl}/${path}/by-ids`;

    try {
      const response = await firstValueFrom(this.http.post<any>(url, { ids }));
      const result = response.data?.data ?? response.data;
      return Array.isArray(result) ? result : [];
    } catch (err: any) {
      this.logger.error(
        `fetchByIds FAILED | url: ${url} | status: ${err?.response?.status} | message: ${err?.response?.data ?? err.message}`,
      );
      return [];
    }
  }

  async fetchAllByType(userType: string): Promise<RemoteUser[]> {
    const baseUrl = this.getBaseUrl(userType);
    const path = this.servicePaths[userType];

    if (!baseUrl || !path) {
      this.logger.warn(`No service URL configured for userType=${userType}`);
      return [];
    }

    const url = `${baseUrl}/${path}/all`;

    try {
      const response = await firstValueFrom(this.http.get<any>(url));
      const result = response.data?.data ?? response.data;
      return Array.isArray(result) ? result : [];
    } catch (err: any) {
      this.logger.error(
        `fetchAllByType FAILED | url: ${url} | status: ${err?.response?.status} | message: ${err?.response?.data ?? err.message}`,
      );
      return [];
    }
  }
  async resolveUsers(
    userType: string,
    recipientIds?: string[],
  ): Promise<RemoteUser[]> {
    if (recipientIds && recipientIds.length > 0) {
      return this.fetchByIds(userType, recipientIds);
    }
    return this.fetchAllByType(userType);
  }
}
