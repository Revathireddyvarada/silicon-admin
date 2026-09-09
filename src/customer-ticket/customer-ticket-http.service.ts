import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

type UploadedFile = {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class CustomerTicketHttpService {
  private readonly logger = new Logger(CustomerTicketHttpService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL =
      this.configService.get<string>("CUSTOMER_SERVICE_URL") ?? "";
    this.http = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
    });
  }


  private async buildForm(
    fields: Record<string, string | string[] | undefined>,
    file?: UploadedFile,
  ) {
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) form.append(key, item);
      } else {
        form.append(key, value);
      }
    }
    if (file) {
      form.append("attachment", file.buffer, {
        filename: file.filename,
        contentType: file.mimetype,
      });
    }
    return form;
  }


  async getAllCategories(): Promise<any[]> {
    try {
      const res = await this.http.get("/ticket-categories");
      return res.data?.data ?? res.data ?? [];
    } catch (error: any) {
      this.logger.error(
        `getAllCategories failed: ${error?.response?.data?.message || error.message}`,
      );
      return [];
    }
  }


  async quickCreateTicket(
    payload: {
      categoryId: string;
      categoryName: string;
      rideIds?: string[];
    },
    customerId: string,
  ): Promise<any> {
    try {
      const res = await this.http.post(
        "/customer-tickets/quick-create",
        payload,
        { headers: { "x-customer-id": customerId } },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      this.logger.error(
        `quickCreateTicket failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }


  async getMyRides(customerId: string): Promise<any[]> {
    try {
      const res = await this.http.get("/customer-tickets/my-rides", {
        headers: { "x-customer-id": customerId },
      });
      return res.data?.data ?? res.data ?? [];
    } catch (error: any) {
      this.logger.error(
        `getMyRides failed: ${error?.response?.data?.message || error.message}`,
      );
      return [];
    }
  }


  async getMyTickets(
    customerId: string,
    query?: {
      search?: string;
      status?: string;
      categoryId?: string;
      fromDate?: string;
      toDate?: string;
      rideId?: string;
    },
  ): Promise<any[]> {
    try {
      const res = await this.http.get("/customer-tickets/my-tickets", {
        params: query,
        headers: { "x-customer-id": customerId },
      });
      return res.data?.data ?? res.data ?? [];
    } catch (error: any) {
      this.logger.error(
        `getMyTickets failed: ${error?.response?.data?.message || error.message}`,
      );
      return [];
    }
  }

  async getMyTicketsPaginated(
    customerId: string,
    query?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      categoryId?: string;
      fromDate?: string;
      toDate?: string;
      rideId?: string;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    },
  ): Promise<any> {
    try {
      const res = await this.http.get(
        "/customer-tickets/my-tickets/pagination",
        {
          params: query,
          headers: { "x-customer-id": customerId },
        },
      );
      return (
        res.data?.data ??
        res.data ?? { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }
      );
    } catch (error: any) {
      this.logger.error(
        `getMyTicketsPaginated failed: ${error?.response?.data?.message || error.message}`,
      );
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
  }

  // ─── Admin — All Tickets ──────────────────────────────────────────────────

  async getAllTickets(query?: {
    search?: string;
    status?: string;
    categoryId?: string;
    fromDate?: string;
    toDate?: string;
    customerId?: string;
    rideId?: string;
  }): Promise<any[]> {
    try {
      const res = await this.http.get("/customer-tickets", { params: query });
      return res.data?.data ?? res.data ?? [];
    } catch (error: any) {
      this.logger.error(
        `getAllTickets failed: ${error?.response?.data?.message || error.message}`,
      );
      return [];
    }
  }

  async getTicketsPaginated(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string;
    fromDate?: string;
    toDate?: string;
    customerId?: string;
    rideId?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<any> {
    try {
      const res = await this.http.get("/customer-tickets/pagination", {
        params: query,
      });
      return (
        res.data?.data ??
        res.data ?? { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }
      );
    } catch (error: any) {
      this.logger.error(
        `getTicketsPaginated failed: ${error?.response?.data?.message || error.message}`,
      );
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
  }

  // ─── Get Single Ticket ────────────────────────────────────────────────────

  async getTicketById(ticketId: string): Promise<any> {
    try {
      const res = await this.http.get(`/customer-tickets/${ticketId}`);
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Customer ticket ${ticketId} not found`);
      }
      this.logger.error(
        `getTicketById failed: ${error?.response?.data?.message || error.message}`,
      );
      return null;
    }
  }

  // ─── Admin Create ─────────────────────────────────────────────────────────

  async adminCreateTicket(
    payload: {
      subject: string;
      categoryId?: string;
      description?: string;
      assignTo?: string;
      rideIds?: string[];
    },
    adminId: string,
    file?: UploadedFile,
  ): Promise<any> {
    try {
      const form = await this.buildForm(
        {
          subject: payload.subject,
          categoryId: payload.categoryId,
          description: payload.description,
          assignTo: payload.assignTo,
          rideIds: payload.rideIds,
        },
        file,
      );
      const res = await this.http.post("/customer-tickets/admin-create", form, {
        headers: {
          ...form.getHeaders(),
          "x-sender-id": adminId,
        },
      });
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      this.logger.error(
        `adminCreateTicket failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  // ─── Admin Update ─────────────────────────────────────────────────────────

  async adminUpdateTicket(
    ticketId: string,
    payload: {
      subject?: string;
      categoryId?: string;
      description?: string;
      assignTo?: string;
      rideIds?: string[];
    },
    file?: UploadedFile,
  ): Promise<any> {
    try {
      const form = await this.buildForm(
        {
          subject: payload.subject,
          categoryId: payload.categoryId,
          description: payload.description,
          assignTo: payload.assignTo,
          rideIds: payload.rideIds,
        },
        file,
      );
      const res = await this.http.patch(
        `/customer-tickets/${ticketId}/admin-update`,
        form,
        { headers: { ...form.getHeaders() } },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Customer ticket ${ticketId} not found`);
      }
      this.logger.error(
        `adminUpdateTicket failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  // ─── Change Status ────────────────────────────────────────────────────────

  async changeTicketStatus(ticketId: string, status: string): Promise<any> {
    try {
      const res = await this.http.patch(
        `/customer-tickets/${ticketId}/status`,
        { status },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Customer ticket ${ticketId} not found`);
      }
      this.logger.error(
        `changeTicketStatus failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  // ─── Assign Staff ─────────────────────────────────────────────────────────

  async assignStaff(ticketId: string, staffId: string): Promise<any> {
    try {
      const res = await this.http.patch(
        `/customer-tickets/${ticketId}/assign`,
        { assignTo: staffId },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Customer ticket ${ticketId} not found`);
      }
      this.logger.error(
        `assignStaff failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }


  async deleteTicket(ticketId: string): Promise<any> {
    try {
      const res = await this.http.delete(`/customer-tickets/${ticketId}`);
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Customer ticket ${ticketId} not found`);
      }
      this.logger.error(
        `deleteTicket failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }


  async getConversations(ticketId: string, rideId?: string): Promise<any[]> {
    try {
      const res = await this.http.get(
        `/customer-tickets/${ticketId}/conversations`,
        { params: rideId ? { rideId } : {} },
      );
      return res.data?.data ?? res.data ?? [];
    } catch (error: any) {
      this.logger.error(
        `getConversations failed: ${error?.response?.data?.message || error.message}`,
      );
      return [];
    }
  }

  async addAdminReply(
    ticketId: string,
    payload: { message?: string },
    adminId: string,
    file?: UploadedFile,
  ): Promise<any> {
    try {
      const form = await this.buildForm({ message: payload.message }, file);
      const res = await this.http.post(
        `/customer-tickets/${ticketId}/conversations/reply`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            "x-sender-id": adminId,
            "x-sender-type": "admin",
          },
        },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      this.logger.error(
        `addAdminReply failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async addStaffReply(
    ticketId: string,
    payload: { message?: string },
    staffId: string,
    file?: UploadedFile,
  ): Promise<any> {
    try {
      const form = await this.buildForm({ message: payload.message }, file);
      const res = await this.http.post(
        `/customer-tickets/${ticketId}/conversations/reply`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            "x-sender-id": staffId,
            "x-sender-type": "staff",
          },
        },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      this.logger.error(
        `addStaffReply failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async editConversation(
    ticketId: string,
    conversationId: string,
    payload: { message?: string },
    senderId: string,
    file?: UploadedFile,
  ): Promise<any> {
    try {
      const form = await this.buildForm({ message: payload.message }, file);
      const res = await this.http.patch(
        `/customer-tickets/${ticketId}/conversations/${conversationId}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            "x-sender-id": senderId,
          },
        },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Conversation ${conversationId} not found`);
      }
      this.logger.error(
        `editConversation failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async deleteConversation(
    ticketId: string,
    conversationId: string,
    senderId: string,
  ): Promise<any> {
    try {
      const res = await this.http.delete(
        `/customer-tickets/${ticketId}/conversations/${conversationId}`,
        { headers: { "x-sender-id": senderId } },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Conversation ${conversationId} not found`);
      }
      this.logger.error(
        `deleteConversation failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }
}
