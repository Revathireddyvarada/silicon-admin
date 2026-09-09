import { Injectable, HttpException } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

@Injectable()
export class VehiclesService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.DRIVER_SERVICE_URL ?? "http://localhost:3004/api",
      //baseURL: "http://localhost:3004/api",
      timeout: 10000,
    });
  }

  async get(
    path: string,
    token?: string,
    params?: Record<string, any>,
    fleetOwnerId?: string,
  ) {
    try {
      const res = await this.client.get(path, {
        headers: {
          Authorization: token ?? "",
          "x-fleetowner-id": fleetOwnerId ?? "",
        },
        params,
        validateStatus: () => true,
      });
      return res;
    } catch (err) {
      console.error("Proxy from fleetowner service - error:", err);
      return {
        status: 502,
        data: { message: "Driver service unavailable" },
      };
    }
  }

  async post(path: string, token?: string, body?: any, fleetOwnerId?: string) {
    try {
      const res = await this.client.post(path, body, {
        headers: {
          Authorization: token ?? "",
          "x-fleetowner-id": fleetOwnerId ?? "",
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      });
      return res;
    } catch (err) {
      console.error("Proxy from fleetowner service - error:", err);
      return {
        status: 502,
        data: { message: "Driver service unavailable" },
      };
    }
  }

  async patch(path: string, token?: string, body?: any, fleetOwnerId?: string) {
    try {
      const res = await this.client.patch(path, body, {
        headers: {
          Authorization: token ?? "",
          "x-fleetowner-id": fleetOwnerId ?? "",
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      });
      return res;
    } catch (err) {
      console.error("Proxy from fleetowner service - error:", err);
      return {
        status: 502,
        data: { message: "Driver service unavailable" },
      };
    }
  }

  async delete(path: string, token?: string, fleetOwnerId?: string) {
    try {
      const res = await this.client.delete(path, {
        headers: {
          Authorization: token ?? "",
          "x-fleetowner-id": fleetOwnerId ?? "",
        },
        validateStatus: () => true,
      });
      return res;
    } catch (err) {
      console.error("Proxy from fleetowner service - error:", err);
      return {
        status: 502,
        data: { message: "Driver service unavailable" },
      };
    }
  }
}
