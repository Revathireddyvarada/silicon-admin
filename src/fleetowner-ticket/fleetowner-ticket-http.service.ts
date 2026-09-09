import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { NotificationService } from "../notification/notification.service";

type UploadedFile = {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class FleetownerTicketHttpService {
  private readonly logger = new Logger(FleetownerTicketHttpService.name);
  private readonly http: AxiosInstance;
  private readonly realtimeBaseUrl: string;

  // constructor(private readonly configService: ConfigService) {
  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {
    const baseURL =
      this.configService.get<string>("FLEETOWNER_SERVICE_URL") ?? "";
    this.http = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
    });
    this.realtimeBaseUrl =
      this.configService.get<string>("REALTIME_SERVICE_URL") ??
      "http://localhost:3011/api";
  }

  private async notifyRealtimeSocket(
    event: string,
    body: object,
  ): Promise<void> {
    try {
      await axios.post(
        `${this.realtimeBaseUrl}/internal/socket/${event}`,
        body,
        { headers: { "Content-Type": "application/json" } },
      );
      this.logger.log(`📡 Realtime socket notified: ${event}`);
    } catch (error: any) {
      this.logger.warn(
        `Realtime socket webhook failed [${event}]: ${error?.response?.data?.message || error.message}`,
      );
    }
  }

  async adminCreateTicket(
    payload: {
      subject: string;
      categoryId?: string;
      description?: string;
      createType?: string;
      assignTo?: string;
    },
    adminId: string,
    file?: UploadedFile,
  ): Promise<any> {
    try {
      const FormData = (await import("form-data")).default;
      const form = new FormData();
      form.append("subject", payload.subject);
      if (payload.categoryId) form.append("categoryId", payload.categoryId);
      if (payload.description) form.append("description", payload.description);
      if (payload.createType) form.append("createType", payload.createType);
      if (payload.assignTo) form.append("assignTo", payload.assignTo);
      if (file) {
        form.append("attachment", file.buffer, {
          filename: file.filename,
          contentType: file.mimetype,
        });
      }
      const res = await this.http.post(
        "/fleetowner-tickets/admin-create",
        form,
        {
          headers: { ...form.getHeaders(), "x-sender-id": adminId },
        },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      this.logger.error(
        `adminCreateTicket failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async adminUpdateTicket(
    ticketId: string,
    payload: {
      subject?: string;
      categoryId?: string;
      description?: string;
      createType?: string;
      assignTo?: string;
    },
    file?: UploadedFile,
  ): Promise<any> {
    try {
      const FormData = (await import("form-data")).default;
      const form = new FormData();
      if (payload.subject) form.append("subject", payload.subject);
      if (payload.categoryId) form.append("categoryId", payload.categoryId);
      if (payload.description) form.append("description", payload.description);
      if (payload.createType) form.append("createType", payload.createType);
      if (payload.assignTo) form.append("assignTo", payload.assignTo);
      if (file) {
        form.append("attachment", file.buffer, {
          filename: file.filename,
          contentType: file.mimetype,
        });
      }
      const res = await this.http.patch(
        `/fleetowner-tickets/${ticketId}/admin-update`,
        form,
        { headers: { ...form.getHeaders() } },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }
      this.logger.error(
        `adminUpdateTicket failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async getAllTickets(query?: {
    search?: string;
    status?: string;
    categoryId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<any[]> {
    try {
      const res = await this.http.get("/fleetowner-tickets", { params: query });
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
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<any> {
    try {
      const res = await this.http.get("/fleetowner-tickets/pagination", {
        params: query,
      });
      return res.data?.data ?? res.data ?? { data: [], total: 0 };
    } catch (error: any) {
      this.logger.error(
        `getTicketsPaginated failed: ${error?.response?.data?.message || error.message}`,
      );
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
  }

  async getTicketsCursor(query: {
    limit?: number;
    cursor?: string;
    search?: string;
    status?: string;
    categoryId?: string;
    fromDate?: string;
    toDate?: string;
    assignTo?: string;
  }): Promise<any> {
    try {
      const res = await this.http.get("/fleetowner-tickets/cursor", {
        params: query,
      });
      return (
        res.data?.data ??
        res.data ?? {
          data: [],
          meta: {
            limit: query.limit ?? 10,
            nextCursor: null,
            hasNextPage: false,
            hasPrevPage: false,
          },
        }
      );
    } catch (error: any) {
      this.logger.error(
        `getTicketsCursor failed: ${error?.response?.data?.message || error.message}`,
      );
      return {
        data: [],
        meta: {
          limit: query.limit ?? 10,
          nextCursor: null,
          hasNextPage: false,
          hasPrevPage: Boolean(query.cursor),
        },
      };
    }
  }

  async getTicketById(ticketId: string): Promise<any> {
    try {
      const res = await this.http.get(`/fleetowner-tickets/${ticketId}`);
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }
      this.logger.error(
        `getTicketById failed: ${error?.response?.data?.message || error.message}`,
      );
      return null;
    }
  }

  async changeTicketStatus(ticketId: string, status: string): Promise<any> {
    try {
      const res = await this.http.patch(
        `/fleetowner-tickets/${ticketId}/status`,
        { status },
      );
      const data = res.data?.data ?? res.data ?? null;

      await this.notifyRealtimeSocket("ticket-status", { ticketId, status });

      return data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }
      this.logger.error(
        `changeTicketStatus failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async assignStaff(ticketId: string, staffId: string): Promise<any> {
    try {
      const res = await this.http.patch(
        `/fleetowner-tickets/${ticketId}/assign`,
        { staffId: staffId },
      );
      const data = res.data?.data ?? res.data ?? null;
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }
      this.logger.error(
        `assignStaff failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async getConversations(ticketId: string): Promise<any[]> {
    try {
      const res = await this.http.get(
        `/fleetowner-tickets/${ticketId}/conversations`,
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
      const FormData = (await import("form-data")).default;
      const form = new FormData();
      if (payload.message) form.append("message", payload.message);
      if (file) {
        form.append("attachment", file.buffer, {
          filename: file.filename,
          contentType: file.mimetype,
        });
      }
      const res = await this.http.post(
        `/fleetowner-tickets/${ticketId}/conversations/reply`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            "x-sender-id": adminId,
            "x-sender-type": "admin",
          },
        },
      );
      const data = res.data?.data ?? res.data ?? null;

      await this.notifyRealtimeSocket("conversation-new", {
        ticketId,
        conversationId: data?.id ?? "",
        message: data?.message ?? payload.message,
        attachment: data?.attachment ?? null,
        senderType: "admin" as const,
        senderId: adminId,
        sender: data?.sender ?? null,
        createdAt: data?.createdAt ?? new Date(),
      });

      return data;
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
      const FormData = (await import("form-data")).default;
      const form = new FormData();
      if (payload.message) form.append("message", payload.message);
      if (file) {
        form.append("attachment", file.buffer, {
          filename: file.filename,
          contentType: file.mimetype,
        });
      }
      const res = await this.http.post(
        `/fleetowner-tickets/${ticketId}/conversations/reply`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            "x-sender-id": staffId,
            "x-sender-type": "staff",
          },
        },
      );
      const data = res.data?.data ?? res.data ?? null;

      await this.notifyRealtimeSocket("conversation-new", {
        ticketId,
        conversationId: data?.id ?? "",
        message: data?.message ?? payload.message,
        attachment: data?.attachment ?? null,
        senderType: "staff" as const,
        senderId: staffId,
        sender: data?.sender ?? null,
        createdAt: data?.createdAt ?? new Date(),
      });

      return data;
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
      const FormData = (await import("form-data")).default;
      const form = new FormData();
      if (payload.message) form.append("message", payload.message);
      if (file) {
        form.append("attachment", file.buffer, {
          filename: file.filename,
          contentType: file.mimetype,
        });
      }
      const res = await this.http.patch(
        `/fleetowner-tickets/${ticketId}/conversations/${conversationId}`,
        form,
        {
          headers: { ...form.getHeaders(), "x-sender-id": senderId },
        },
      );
      const data = res.data?.data ?? res.data ?? null;

      await this.notifyRealtimeSocket("conversation-updated", {
        ticketId,
        conversationId,
        message: data?.message ?? payload.message,
        attachment: data?.attachment ?? null,
        senderType: (data?.senderType ?? "admin") as
          | "admin"
          | "staff"
          | "fleetowner",
        senderId,
        sender: data?.sender ?? null,
        updatedAt: data?.updatedAt ?? new Date(),
        editedBy: {
          id: data?.editedBy ?? senderId,
          name: data?.editedByUser?.name ?? null,
        },
      });

      return data;
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
        `/fleetowner-tickets/${ticketId}/conversations/${conversationId}`,
        {
          headers: { "x-sender-id": senderId, "Content-Type": undefined },
        },
      );
      const data = res.data?.data ?? res.data ?? null;

      await this.notifyRealtimeSocket("conversation-deleted", {
        ticketId,
        conversationId,
        deletedBy: {
          id: senderId,
          name: data?.deletedByUser?.name ?? null,
        },
      });

      return data;
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

  async deleteTicket(ticketId: string): Promise<any> {
    try {
      const res = await this.http.delete(`/fleetowner-tickets/${ticketId}`, {
        headers: { "Content-Type": undefined },
      });
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }
      this.logger.error(
        `deleteTicket failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }
}
