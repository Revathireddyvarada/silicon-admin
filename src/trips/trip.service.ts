import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import axios from "axios";

/** Pull driver UUID from ride-service / nested trip payloads for debug logs. */
function extractTripDriverId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const visit = (node: unknown): string | null => {
    if (!node || typeof node !== "object") return null;
    const obj = node as Record<string, unknown>;
    for (const key of ["driverId", "driver_id"] as const) {
      const value = obj[key];
      const text = value == null ? "" : String(value).trim();
      if (text && text !== "0") return text;
    }
    const driver = obj.driver;
    if (driver && typeof driver === "object") {
      const driverObj = driver as Record<string, unknown>;
      const nested = driverObj.data ?? driverObj;
      if (nested && typeof nested === "object") {
        const id = (nested as Record<string, unknown>).id;
        const text = id == null ? "" : String(id).trim();
        if (text && text !== "0") return text;
      }
    }
    return null;
  };

  const root = payload as Record<string, unknown>;
  return (
    visit(root.data) ??
    visit(root.trip) ??
    visit(root.overview) ??
    visit(root)
  );
}

@Injectable()
export class TripService {
  private readonly logger = new Logger(TripService.name);

  private getRideServiceUrl(): string {
    return (process.env.RIDE_SERVICE_URL || "").replace(/\/$/, "");
  }

  // Get trips for a specific driver
  async getTrips(token: string, queryParams: any): Promise<any> {
    try {
      const url = `${this.getRideServiceUrl()}/trips`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
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

  async getTripbyId(id: string, token: string): Promise<any> {
    try {
      const url = `${this.getRideServiceUrl()}/trips/${id}`;
      this.logger.log(
        `[trip-details] GET trip by id tripId=${id} url=${url}`,
      );

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const driverId = extractTripDriverId(response.data);
      this.logger.log(
        `[trip-details] tripId=${id} driverId=${driverId ?? "MISSING"} status=${String((response.data as { data?: { status?: string }; status?: string })?.data?.status ?? (response.data as { status?: string })?.status ?? "n/a")}`,
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  async getTripOverview(id: string, token: string): Promise<any> {
    try {
      const url = `${this.getRideServiceUrl()}/trips/overview/${id}`;
      this.logger.log(
        `[trip-overview] GET overview tripId=${id} url=${url}`,
      );

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const driverId = extractTripDriverId(response.data);
      this.logger.log(
        `[trip-overview] tripId=${id} driverId=${driverId ?? "MISSING"}`,
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  async tripexportfiles(
    token: string,
    filters?: {
      vendorId?: string;
      driverId?: string;
      fleetId?: string;
      search?: string;
      pickupLocation?: string;
      dropLocation?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
      is_security?: boolean;
      rating?: string;
    },
  ): Promise<any> {
    try {
      const url = `${this.getRideServiceUrl()}/trips/export/csv`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          vendorId: filters?.vendorId,
          driverId: filters?.driverId,
          fleetId: filters?.fleetId,
          search: filters?.search,
          pickupLocation: filters?.pickupLocation,
          dropLocation: filters?.dropLocation,
          status: filters?.status,
          fromDate: filters?.fromDate,
          toDate: filters?.toDate,
          is_security: filters?.is_security,
          rating: filters?.rating,
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  // get the reviews based on the trips
  async reviewTripRatings(
    token: string,
    filters: {
      fromDate?: string;
      toDate?: string;
      startDate?: string;
      endDate?: string;
      driverId?: string;
      rating?: string;
      page?: string | number;
      limit?: string | number;
    },
  ): Promise<any> {
    try {
      const url = `${this.getRideServiceUrl()}/trips/review-ratings`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          ...(filters.fromDate && { fromDate: filters.fromDate }),
          ...(filters.toDate && { toDate: filters.toDate }),
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
          ...(filters.driverId && { driverId: filters.driverId }),
          ...(filters.rating && { rating: filters.rating }),
          ...(filters.page != null && { page: filters.page }),
          ...(filters.limit != null && { limit: filters.limit }),
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(error?.response?.data || error.message, error?.stack);
      throw error;
    }
  }

  async getTripTrackingDetails(
    token: string,
    tripId: string,
    requestedAt?: string,
  ): Promise<any> {
    try {
      const baseUrl = this.getRideServiceUrl();
      if (!baseUrl) {
        throw new HttpException(
          "RIDE_SERVICE_URL is not configured",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const url = `${baseUrl}/trips/trip-tracking-details`;

      const params: Record<string, string> = { tripId };
      if (requestedAt?.trim()) {
        params.requestedAt = requestedAt.trim();
      }

      this.logger.log(
        `[trip-tracking] GET tracking details tripId=${tripId} requestedAt=${requestedAt?.trim() || "n/a"} url=${url}`,
      );

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params,
        timeout: 15000,
      });

      const driverId = extractTripDriverId(response.data);
      const tracking = (response.data as { data?: Record<string, unknown> })?.data ??
        (response.data as Record<string, unknown>);
      this.logger.log(
        `[trip-tracking] tripId=${tripId} driverId=${driverId ?? "MISSING"} ` +
          `driverName=${String(tracking?.driverName ?? "n/a")} status=${String(tracking?.status ?? "n/a")}`,
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `[trip-tracking] failed tripId=${tripId} requestedAt=${requestedAt?.trim() || "n/a"}: ${JSON.stringify(error?.response?.data ?? error.message)}`,
        error?.stack,
      );
      if (error instanceof HttpException) throw error;
      if (error?.response) {
        throw new HttpException(
          error.response.data ?? { message: "Error from ride service" },
          error.response.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const reason =
        error?.code || error?.cause?.code || error?.message || "unknown";
      throw new HttpException(
        {
          success: false,
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: "Ride service is unavailable",
          reason: String(reason),
          rideServiceUrl: this.getRideServiceUrl() || null,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Alias used by Admin FE fallback: PATCH /trips/driver-payment-status/:id
   * Proxies to driver-service mark-payment (same as PATCH /drivers/transactions/:id/mark-payment).
   */
  async markDriverPaymentStatus(
    tripId: string,
    payload: Record<string, unknown>,
    authHeader: string,
  ): Promise<any> {
    const driverBase = (
      process.env.DRIVER_SERVICE_URL || "http://localhost:3004/api"
    ).replace(/\/$/, "");
    const url = `${driverBase}/drivers/transactions/${encodeURIComponent(tripId)}/mark-payment`;

    // Normalize FE body shapes → MarkTransactionPaymentDto
    const rawStatus = String(
      payload.status ?? payload.paymentStatus ?? "Paid",
    ).trim();
    const status =
      rawStatus.toLowerCase() === "paid" || rawStatus.toLowerCase() === "completed"
        ? "Paid"
        : "Unpaid";
    const body = {
      paymentMethod: payload.paymentMethod ?? "upi",
      status,
      transactionId: payload.transactionId,
      notes: payload.notes,
      paidBy: payload.paidBy,
      payment_related_doc: payload.payment_related_doc ?? null,
    };

    try {
      const response = await axios.patch(url, body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader || "",
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
