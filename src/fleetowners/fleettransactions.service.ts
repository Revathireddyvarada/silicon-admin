import { Injectable, HttpException } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

@Injectable()
export class FleettransactionsService {
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
  ) {
    try {
      const res = await this.client.get(path, {
        headers: {
          Authorization: token ?? "",
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

}
