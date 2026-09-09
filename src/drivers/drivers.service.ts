import { Injectable, Logger,  HttpException, HttpStatus, NotFoundException, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import axios from "axios";
import { AddDriverPayloadDto, UpdateDriverPayloadDto, BlockDriverPayloadDto,UpdateDriverVerifyStatusDto, SendOTPDtoForDriver,  VerifyOtpDtoForDriver } from "./dto/driver.dto";
import {CreateActivityLogDto} from "../activity-log/dto/activity-log.dto";
import { ActivityLogService } from "../activity-log/activity-log.service";
import { CitiesService } from "../cities/cities.service";
import { FastifyRequest } from "fastify";
import FormData from "form-data";
import { NotificationClientService, DriverDocumentNotification } from "../send-notification/notification-client.service";


const FLAGGED_STATUSES = new Set([
  "rejected",
  "clarification_required",
]);

interface DocumentFieldConfig {
  section: string;     // top-level key in the payload, e.g. "driver_kyc"
  statusField: string; // e.g. "driving_licence_status"
  notesField: string;  // e.g. "driving_licence_notes"
  label: string;       // human-readable, used in the notification copy
}

const DOCUMENT_FIELD_CONFIG: DocumentFieldConfig[] = [
  { section: "driver_profile", statusField: "profile_status", notesField: "profile_notes", label: "Profile" },

  { section: "driver_aadhar", statusField: "aadhar_status", notesField: "notes", label: "Aadhar Card" },

  { section: "driver_kyc", statusField: "driving_licence_status", notesField: "driving_licence_notes", label: "Driving Licence" },
  { section: "driver_kyc", statusField: "epic_card_status", notesField: "epic_card_notes", label: "EPIC Card" },
  { section: "driver_kyc", statusField: "pancard_status", notesField: "pancard_notes", label: "PAN Card" },
  { section: "driver_kyc", statusField: "pvc_status", notesField: "pvc_notes", label: "PVC" },
  { section: "driver_kyc", statusField: "medical_certificate_status", notesField: "medical_certificate_notes", label: "Medical Certificate" },
  { section: "driver_kyc", statusField: "background_verification_status", notesField: "background_verification_notes", label: "Background Verification" },
  { section: "driver_kyc", statusField: "court_verification_status", notesField: "court_verification_notes", label: "Court Verification" },

  { section: "driver_vehicle_documents", statusField: "rc_status", notesField: "rc_notes", label: "RC" },
  { section: "driver_vehicle_documents", statusField: "fitness_certificate_status", notesField: "fitness_certificate_notes", label: "Fitness Certificate" },
  { section: "driver_vehicle_documents", statusField: "insurance_status", notesField: "insurance_notes", label: "Insurance" },
  { section: "driver_vehicle_documents", statusField: "emission_puc_status", notesField: "emission_puc_notes", label: "Emission (PUC)" },
  { section: "driver_vehicle_documents", statusField: "permit_status", notesField: "permit_notes", label: "Permit" },
  { section: "driver_vehicle_documents", statusField: "tax_status", notesField: "tax_notes", label: "Tax" },
];



@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);
    constructor(
      private readonly activityLogService: ActivityLogService,
      private readonly citiesService: CitiesService,
      private readonly notificationClient: NotificationClientService,

    ) {}


  /** Existing drivers often store city name, not the header UUID. */
  private async withResolvedCityName(query: any): Promise<any> {
    const params = { ...(query || {}) };
    const cityId = String(params.cityId || params.city_id || "").trim();
    const existingName = String(params.cityName || "").trim();
    const placeholder = /^(all cities|selected city)$/i.test(existingName);
    if (cityId) params.cityId = cityId;
    if (existingName && !placeholder) {
      params.cityName = existingName;
      return params;
    }
    if (!cityId) return params;
    try {
      const city = await this.citiesService.findOne(cityId);
      if (city?.city_name) params.cityName = city.city_name;
    } catch (error: any) {
      this.logger.warn(
        `Could not resolve city name for ${cityId}: ${error?.message || error}`,
      );
    }
    return params;
  }

  private async logActivity(
    dto: CreateActivityLogDto,
    currentUserId?: string,
  ): Promise<void> {
    try {
      await this.activityLogService.log(dto, currentUserId);
    } catch (logError: any) {
      this.logger.warn(
        `Failed to write activity log for action "${dto.action}": ${
          logError?.message || logError
        }`,
      );
    }
  }

  
  // Add driver
  async addDriver(payload: AddDriverPayloadDto, token: string): Promise<any> {
    try {
      const url = `${process.env.DRIVER_SERVICE_URL}/drivers/add`;

      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

            const driver = response.data;
    
      const driverName =
        [driver?.data?.firstName, driver?.data?.lastName].filter(Boolean).join(" ") ||
        driver?.id;

      await this.logActivity(
        {
          action: "ADD_DRIVER",
          description: `Driver ${driverName} completed the Personal Details section.`,
          modelName: "Driver",
          recordId: 46,
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        error?.response?.data || error.message,
        error?.stack,
      );

      if (error?.response) {
        const status = error.response.status;
        const data = error.response.data;

        throw new HttpException(
          {
            statusCode: status,
            message: data?.message ?? "Error from driver service",
            error: data?.error ?? "Error",
          },
          status,
        );
      }

      throw new HttpException(
        "Driver service is unavailable",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // Find all drivers
  async findAll(
    query: any,
    token: string,
    adminId: string | undefined,
    req: FastifyRequest,
  ): Promise<any> {
    try {
      console.log("Query params in service:", token, query);

      const url = `${process.env.DRIVER_SERVICE_URL}/drivers`;

      const response = await axios.get(url, {
        headers: {
          Authorization: token ?? "",
          "content-type": req.headers["content-type"],
          "x-admin-id": adminId ?? null,
        },
        params: query,
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  async findAllCursor(
    query: any,
    token: string,
    adminId: string | undefined,
    req: FastifyRequest,
  ): Promise<any> {
    try {
      const url = `${process.env.DRIVER_SERVICE_URL}/drivers/cursor`;
      const params = await this.withResolvedCityName(query);

      const response = await axios.get(url, {
        headers: {
          Authorization: token ?? "",
          "content-type": req.headers["content-type"],
          "x-admin-id": adminId ?? null,
        },
        params,
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  // Find drivers based on id with related filters

  async findOne(id: string, token: string): Promise<any> {
    try {
      const url = `${process.env.DRIVER_SERVICE_URL}/drivers/${id}`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // driver-service (and gateway) may wrap as { success, data: driver }
      const body = response.data;
      const driver =
        body &&
        typeof body === "object" &&
        "data" in body &&
        body.data &&
        typeof body.data === "object" &&
        !Array.isArray(body.data)
          ? body.data
          : body;

      if (driver && typeof driver === "object") {
        const coerce = (v: unknown): boolean => {
          if (v === true || v === 1) return true;
          if (v === false || v === 0 || v == null || v === "") return false;
          const s = String(v).toLowerCase().trim();
          if (["true", "yes", "1", "t", "y"].includes(s)) return true;
          return false;
        };
        (driver as any).resident_of_karnataka = coerce(
          (driver as any).resident_of_karnataka,
        );
        (driver as any).do_you_know_kannada = coerce(
          (driver as any).do_you_know_kannada,
        );
      }

      return driver;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  // update drivers based on id update that respective driver details

  async updateDriver(
    id: string,
    payload: UpdateDriverPayloadDto,
    // token: string,
  ): Promise<any> {
    try {
      const url = `${process.env.DRIVER_SERVICE_URL}/drivers/${id}`;

      const response = await axios.patch(url, payload, {
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  // delete drivers based on id

  async removeDriver(id: string, token: string): Promise<any> {
    try {
      const url = `${process.env.DRIVER_SERVICE_URL}/drivers/${id}`;

      const response = await axios.delete(url, {
        data: { is_deleted: true },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  // block drivers based on id
  async blockDriver(id: string): Promise<any> {
    try {
      const url = `${process.env.DRIVER_SERVICE_URL}/drivers/block/${id}`;
      const response = await axios.patch(url, null);
      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  async unblockDriver(id: string): Promise<any> {
    try {
      const url = `${process.env.DRIVER_SERVICE_URL}/drivers/unblock/${id}`;
      const response = await axios.patch(url, null);
      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  // Driver Overview Url details
  // tab scopes the payload so FE only waits on the active tab's data.
  static readonly OVERVIEW_TABS = [
    "overview",
    "vehicle-info",
    "trips",
    "track-driver",
    "transaction",
    "review",
  ] as const;

  async getDriverOverview(
    id: string,
    page: number = 1,
    limit: number = 10,
    tab: string = "overview",
    token?: string,
    extra?: {
      status?: string;
      startDate?: string;
      endDate?: string;
      fromDate?: string;
      toDate?: string;
      rating?: string;
    },
  ): Promise<any> {
    const normalizedTab = String(tab || "overview")
      .trim()
      .toLowerCase();
    const validTabs = DriverService.OVERVIEW_TABS as readonly string[];
    if (!validTabs.includes(normalizedTab)) {
      throw new BadRequestException(
        `Invalid tab "${tab}". Allowed: ${validTabs.join(", ")}`,
      );
    }

    const rideBase = (
      process.env.RIDE_SERVICE_URL ||
      "https://dev-api.silicondrive.com/api/ride-service"
    ).replace(/\/+$/, "");
    const driverBase = (
      process.env.DRIVER_SERVICE_URL ||
      "https://dev-api.silicondrive.com/api/driver-service"
    ).replace(/\/+$/, "");

    const tripsUrl = `${rideBase}/trips`;
    const driverUrl = `${driverBase}/drivers/${id}`;
    const needsDriver =
      normalizedTab === "overview" ||
      normalizedTab === "vehicle-info" ||
      normalizedTab === "track-driver";
    const needsTrips = normalizedTab === "trips";
    const needsTransactions = normalizedTab === "transaction";
    const needsReviews = normalizedTab === "review";

    try {
      if (needsDriver) {
        const driverRes = await axios.get(driverUrl, { timeout: 15000 });
        return { tab: normalizedTab, driver: driverRes.data };
      }

      if (needsTrips) {
        const tripsRes = await axios.get(tripsUrl, {
          params: { driverId: id, page, limit },
          timeout: 15000,
        });
        return { tab: normalizedTab, trips: tripsRes.data };
      }

      if (needsTransactions) {
        const transactions = await this.getTripTransactions(
          id,
          token || "",
          page,
          limit,
          extra?.status,
          extra?.startDate,
          extra?.endDate,
        );
        return { tab: normalizedTab, transactions };
      }

      if (needsReviews) {
        const reviewsRes = await axios.get(`${rideBase}/trips/review-ratings`, {
          params: {
            driverId: id,
            page,
            limit,
            ...(extra?.fromDate && { fromDate: extra.fromDate }),
            ...(extra?.toDate && { toDate: extra.toDate }),
            ...(extra?.startDate && { startDate: extra.startDate }),
            ...(extra?.endDate && { endDate: extra.endDate }),
            ...(extra?.rating && { rating: extra.rating }),
          },
          headers: token
            ? {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            : { "Content-Type": "application/json" },
          timeout: 15000,
        });
        return { tab: normalizedTab, reviews: reviewsRes.data };
      }

      // Unreachable — all tabs handled above
      throw new BadRequestException(`Unhandled tab "${normalizedTab}"`);
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const downstream =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === "string"
          ? error.response.data
          : null) ||
        error?.message ||
        "Failed to load driver overview";
      const status = error?.response?.status;

      this.logger.error(
        `getDriverOverview driver=${id} tab=${normalizedTab} tripsUrl=${tripsUrl} driverUrl=${driverUrl} status=${status ?? "n/a"}: ${JSON.stringify(error?.response?.data || error.message)}`,
        error?.stack,
      );

      if (status === 404) {
        throw new NotFoundException(downstream);
      }
      if (status && status >= 400 && status < 500) {
        throw new BadRequestException(downstream);
      }
      throw new InternalServerErrorException(
        typeof downstream === "string"
          ? downstream
          : "Failed to load driver overview",
      );
    }
  }


  // Dropdown drivers list

  async dropdowndrivers(queryParams: any) {
    try {
      const url = `${process.env.DRIVER_SERVICE_URL}/drivers/Driver-dropdown`;
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          ...queryParams,
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }
async getTripTransactions(
  id: string,
  token: string,
  page: number = 1,
  limit: number = 10,
  status?: string,
  startDate?: string,
  endDate?: string,
): Promise<any> {
  try {
    const baseUrl = `${process.env.DRIVER_SERVICE_URL}/drivers/gettransaction/${id}`;

    const params: any = {
      page,
      limit,
    };

    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(baseUrl, {
      params, 
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    this.logger.error(error?.response?.data || error.message, error?.stack);
    throw error;
  }
}

async getTripTransactionsCursor(
  id: string,
  token: string,
  limit: number = 20,
  cursor?: string,
  status?: string,
  startDate?: string,
  endDate?: string,
  search?: string,
): Promise<any> {
  try {
    const baseUrl = `${process.env.DRIVER_SERVICE_URL}/drivers/admin-transactions-cursor/${id}`;

    const params: any = {
      limit,
    };
    if (cursor) params.cursor = cursor;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (search) params.search = search;

    const response = await axios.get(baseUrl, {
      params,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    this.logger.error(error?.response?.data || error.message, error?.stack);
    throw error;
  }
}


//get the driver summary

async getDriverSummary(token: string): Promise<any> {
  try {
    const url = `${process.env.DRIVER_SERVICE_URL}/drivers/stats/counts`;

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    this.logger.error(error?.response?.data || error.message, error?.stack);
    throw error;
  }
}

async getDriverSummaryAggregated(token: string): Promise<any> {
  try {
    const url = `${process.env.DRIVER_SERVICE_URL}/drivers/stats/aggregated-counts`;

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    this.logger.error(error?.response?.data || error.message, error?.stack);
    throw error;
  }
}



async getCountByFleetOwner(
  fleetownerId: string,
  token: string,
): Promise<any> {
  try {
    const url = `${process.env.DRIVER_SERVICE_URL}/drivers/count-by-fleetowner`;

    const response = await axios.get(url, {
      params: {
        fleetowner_id: fleetownerId,
      },
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    this.logger.error(
      error?.response?.data || error.message,
      error?.stack,
    );

    throw error;
  }
}


// async updateVerifyStatus(
//   id: string,
//   payload: Record<string, unknown> | UpdateDriverVerifyStatusDto,
//   token: string,
// ): Promise<any> {
//   try {
//     const driverBase = (
//       process.env.DRIVER_SERVICE_URL ||
//       "https://dev-api.silicondrive.com/api/driver-service"
//     ).replace(/\/+$/, "");
//     const url = `${driverBase}/drivers/update-verify-status/${id}`;

//     const response = await axios.patch(url, payload, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     return response.data;
//   } catch (error: any) {
//     this.logger.error(error?.response?.data || error.message, error?.stack);
//     throw error;
//   } 
// }

  // send the otp to driver for verification
  
   private resolveFlaggedDocuments(
    payload: Record<string, unknown> | UpdateDriverVerifyStatusDto,
  ): DriverDocumentNotification[] {
    const p = payload as Record<string, any>;
    const flagged: DriverDocumentNotification[] = [];

    for (const { section, statusField, notesField, label } of DOCUMENT_FIELD_CONFIG) {
      const sectionPayload = p?.[section];
      if (!sectionPayload || typeof sectionPayload !== "object") continue;

      const status = sectionPayload[statusField];
      if (typeof status !== "string") continue;

      if (FLAGGED_STATUSES.has(status.toLowerCase().trim())) {
        flagged.push({
          label,
          status,
          notes: sectionPayload[notesField] || undefined,
        });
      }
    }

    return flagged;
  }

  /** Best-effort: notifies the driver per flagged document. Never throws — logs on failure. */
  private async notifyDriverOfDocumentStatus(
    driverId: string,
    token: string,
    documents: DriverDocumentNotification[],
  ): Promise<void> {
    try {
      const driver = await this.findOne(driverId, token);
      const name =
        [driver?.firstName, driver?.lastName].filter(Boolean).join(" ").trim() || "Driver";

      await Promise.allSettled(
        documents.map((doc) =>
          this.notificationClient.sendDriverDocumentStatusUpdate(
            { driverId, name, email: driver?.email },
            doc,
          ),
        ),
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send document-status notifications for driver=${driverId}: ${error?.message}`,
        error?.stack,
      );
    }
  }

  // async updateVerifyStatus(
  //   id: string,
  //   payload: Record<string, unknown> | UpdateDriverVerifyStatusDto,
  //   token: string,
  // ): Promise<any> {
  //   try {
  //     const driverBase = (
  //       process.env.DRIVER_SERVICE_URL ||
  //       "https://dev-api.silicondrive.com/api/driver-service"
  //     ).replace(/\/+$/, "");
  //     const url = `${driverBase}/drivers/update-verify-status/${id}`;

  //     const response = await axios.patch(url, payload, {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     const flaggedDocuments = this.resolveFlaggedDocuments(payload);
  //     if (flaggedDocuments.length > 0) {
  //       await this.notifyDriverOfDocumentStatus(id, token, flaggedDocuments);
  //     }

  //     return response.data;
  //   } catch (error: any) {
  //     this.logger.error(error?.response?.data || error.message, error?.stack);
  //     throw error;
  //   }
  // }

  async updateVerifyStatus(
  id: string,
  payload: Record<string, unknown> | UpdateDriverVerifyStatusDto,
  token: string,
): Promise<any> {
  try {
    const driverBase = (
      process.env.DRIVER_SERVICE_URL ||
      "https://dev-api.silicondrive.com/api/driver-service"
    ).replace(/\/+$/, "");
    const url = `${driverBase}/drivers/update-verify-status/${id}`;

    const response = await axios.patch(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const flaggedDocuments = this.resolveFlaggedDocuments(payload);
    if (flaggedDocuments.length > 0) {
      await this.notifyDriverOfDocumentStatus(id, token, flaggedDocuments);
    }

    return response.data;
  } catch (error: any) {
    this.logger.error(error?.response?.data || error.message, error?.stack);

    // driver-service already returns a well-formed 4xx with a clear
    // message (e.g. "Please verify Tax document.") — forward that status
    // that status + message as-is instead of letting the raw AxiosError
    // fall through to a generic 500.
    if (error.isAxiosError && error.response) {
      throw new HttpException(
        error.response.data?.message ?? "Driver verification failed",
        error.response.status,
      );
    }

    throw error;
  }
}
  
  
  async sendOTPToDriver(payload: SendOTPDtoForDriver, token: string): Promise<any> {
    try {
      const url = `${process.env.DRIVER_SERVICE_URL}/drivers/Admin-send-otp`;
      // const url = `http://localhost:3004/api/drivers/Admin-send-otp`
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }


  // verify the otp sent to driver for verification
  async verifyOtptodriver(payload: VerifyOtpDtoForDriver, token: string): Promise<any> {
    try {
      const url = `${process.env.DRIVER_SERVICE_URL}/drivers/verify-otp`;

      // const url = `http://localhost:3004/api/drivers/verify-otp`;
      
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    } 
  }


  // find the drivers location
async getDriversLocation(
  token?: string,
  // firstName?: string,
  // lastName?: string,
  // mobile?: string,
  search?: string,
  vehicleBrand?: string,
  vehicleType?: string,
  lat?: number,
  lng?: number,
  radiusMeters?: number,
  page?: number,
  limit?: number,
  liveStatus?: string,
  zoneId?: string,
  compact?: boolean,
  driverId?: string,
  vendorId?: string,
  cityId?: string,
): Promise<any> {
  try {
    const url = `${process.env.DRIVER_SERVICE_URL}/drivers/location-details`;

    const params: Record<string, string> = {};

    if (search)       params.search       = search;
    if (vehicleBrand) params.vehicleBrand = vehicleBrand;
    if (vehicleType)  params.vehicleType  = vehicleType;
    if (page !== undefined) params.page = String(page);
    if (limit !== undefined) params.limit = String(limit);
    if (liveStatus) params.liveStatus = liveStatus;
    if (zoneId) params.zoneId = zoneId;
    if (compact) params.compact = "true";
    if (driverId) params.driverId = driverId;
    if (vendorId) params.vendorId = vendorId;
    if (cityId) params.cityId = cityId;

    if (lat !== undefined && lng !== undefined) {
      params.lat          = String(lat);
      params.lng          = String(lng);
      params.radiusMeters = String(radiusMeters ?? 100); 
    }

    const response = await axios.get(url, {
      params,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });

    return response.data;
  } catch (error: any) {
    this.logger.error(error?.response?.data || error.message, error?.stack);
    if (error?.response) {
      throw new HttpException(
        error.response.data ?? { message: "Error from driver service" },
        error.response.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    throw new HttpException(
      "Driver service is unavailable",
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}


  // async driverImport(payload: AddDriverPayloadDto, token: string): Promise<any> {
  //   try {
  //     const url = `${process.env.DRIVER_SERVICE_URL}/drivers/import`;

  //     const response = await axios.post(url, payload, {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     //       const driver = response.data;
    
  //     // const driverName =
  //     //   [driver?.data?.firstName, driver?.data?.lastName].filter(Boolean).join(" ") ||
  //     //   driver?.id;

  //     // await this.logActivity(
  //     //   {
  //     //     action: "ADD_DRIVER",
  //     //     description: `Driver ${driverName} was added`,
  //     //     modelName: "Driver",
  //     //     recordId: 46,
  //     //   },
  //     // );

  //     return response.data;
  //   } catch (error: any) {
  //     this.logger.error(
  //       error?.response?.data || error.message,
  //       error?.stack,
  //     );

  //     if (error?.response) {
  //       const status = error.response.status;
  //       const data = error.response.data;

  //       throw new HttpException(
  //         {
  //           statusCode: status,
  //           message: data?.message ?? "Error from driver service",
  //           error: data?.error ?? "Error",
  //         },
  //         status,
  //       );
  //     }

  //     throw new HttpException(
  //       "Driver service is unavailable",
  //       HttpStatus.SERVICE_UNAVAILABLE,
  //     );
  //   }
  // }

  async driverImport(
  fileBuffer: Buffer,
  filename: string,
  mimetype: string,
  token: string,
): Promise<any> {
  try {
    const url = `${process.env.DRIVER_SERVICE_URL}/drivers/import`;

    const form = new FormData();
    form.append("file", fileBuffer, { filename, contentType: mimetype });

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000,
    });

    return response.data;
  } catch (error: any) {
    this.logger.error(error?.response?.data || error.message, error?.stack);

    if (error?.response) {
      throw new HttpException(
        {
          statusCode: error.response.status,
          message: error.response.data?.message ?? "Error from driver service",
          error: error.response.data?.error ?? "Error",
        },
        error.response.status,
      );
    }
    throw new HttpException("Driver service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Proxy mark-payment to driver-service.
   * :id is transaction_list.id (UUID). Requires JWT (forwarded to driver-service).
   */
  async markTransactionPayment(
    id: string,
    payload: any,
    token: string,
  ): Promise<any> {
    try {
      const driverBase = (
        process.env.DRIVER_SERVICE_URL || "http://localhost:3004/api"
      ).replace(/\/$/, "");
      const url = `${driverBase}/drivers/transactions/${encodeURIComponent(id)}/mark-payment`;
      const response = await axios.patch(url, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ?? "",
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);

      if (error?.response) {
        throw new HttpException(
          {
            statusCode: error.response.status,
            message:
              error.response.data?.message ?? "Error from driver service",
            error: error.response.data?.error ?? "Error",
            errors: error.response.data?.errors,
          },
          error.response.status,
        );
      }
      throw new HttpException(
        "Driver service is unavailable",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}


