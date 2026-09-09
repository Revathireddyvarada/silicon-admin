import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationClientService } from "../send-notification/notification-client.service";
import { User } from "../entities/user.entity";

type UploadedFile = {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class TicketHttpService {
  private readonly logger = new Logger(TicketHttpService.name);
  private readonly http: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationClient: NotificationClientService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    const baseURL =
      this.configService.get<string>("DRIVER_SERVICE_URL") ??
      "http://localhost:3004/api";
    this.http = axios.create({ baseURL });
  }

  async adminCreateTicket(
    payload: {
      subject: string;
      tripId?: string;
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
      if (payload.tripId) form.append("tripId", payload.tripId);
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
      const res = await this.http.post("/tickets/admin-create", form, {
        headers: { ...form.getHeaders(), "x-sender-id": adminId },
      });
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
      tripId?: string;
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
      if (payload.tripId) form.append("tripId", payload.tripId);
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
        `/tickets/${ticketId}/admin-update`,
        form,
        {
          headers: { ...form.getHeaders() },
        },
      );
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404)
        throw new NotFoundException(`Ticket ${ticketId} not found`);
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
      const res = await this.http.get("/tickets", { params: query });
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
    assignTo?: string;
  }): Promise<any> {
    try {
      const res = await this.http.get("/tickets/pagination", { params: query });
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
      const res = await this.http.get("/tickets/cursor", { params: query });
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
      const res = await this.http.get(`/tickets/${ticketId}`);
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404)
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      this.logger.error(
        `getTicketById failed: ${error?.response?.data?.message || error.message}`,
      );
      return null;
    }
  }

  async changeTicketStatus(ticketId: string, status: string): Promise<any> {
    try {
      const res = await this.http.patch(
        `/tickets/${ticketId}/status`,
        { status },
        {
          headers: { "x-sender-type": "admin" },
        },
      );
      const data = res.data?.data ?? res.data ?? null;

      // Socket emit owned by driver-service → realtime-service.
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404)
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      this.logger.error(
        `changeTicketStatus failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async assignStaff(ticketId: string, staffId: string): Promise<any> {
    try {
      const res = await this.http.patch(`/tickets/${ticketId}/assign`, {
        assignTo: staffId,
      });
      const result = res.data?.data ?? res.data ?? null;

      this.userRepo
        .findOne({ where: { id: staffId, isDeleted: false } })
        .then((staff) => {
          if (!staff?.email) {
            this.logger.warn(
              `assignStaff: no email found for staff ${staffId}`,
            );
            return;
          }

          return this.notificationClient.sendTicketAssigned(
            {
              to: staff.email,
              recipientName:
                `${staff.firstName} ${staff.lastName ?? ""}`.trim(),
            },
            {
              ticketNo: result?.ticketNo ?? ticketId,
              subject: result?.subject ?? "N/A",
            },
          );
        })
        .catch((err) =>
          this.logger.error(
            `assignStaff notification failed: ${err?.message || err}`,
          ),
        );

      return result;
    } catch (error: any) {
      if (error?.response?.status === 404)
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      this.logger.error(
        `assignStaff failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async getConversations(ticketId: string): Promise<any[]> {
    try {
      const res = await this.http.get(`/tickets/${ticketId}/conversations`);
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
        `/tickets/${ticketId}/conversations/reply`,
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

      // conversation:new emitted by driver-service → realtime-service.
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
        `/tickets/${ticketId}/conversations/reply`,
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

      // conversation:new emitted by driver-service → realtime-service.
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
        `/tickets/${ticketId}/conversations/${conversationId}`,
        form,
        { headers: { ...form.getHeaders(), "x-sender-id": senderId } },
      );

      const data = res.data?.data ?? res.data ?? null;

      // conversation:updated emitted by driver-service → realtime-service.
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404)
        throw new NotFoundException(`Conversation ${conversationId} not found`);
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
        `/tickets/${ticketId}/conversations/${conversationId}`,
        { headers: { "x-sender-id": senderId } },
      );

      const data = res.data?.data ?? res.data ?? null;

      // conversation:deleted emitted by driver-service → realtime-service.
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404)
        throw new NotFoundException(`Conversation ${conversationId} not found`);
      this.logger.error(
        `deleteConversation failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async deleteTicket(ticketId: string): Promise<any> {
    try {
      const res = await this.http.delete(`/tickets/${ticketId}`, {
        headers: { "Content-Type": undefined },
      });
      return res.data?.data ?? res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404)
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      this.logger.error(
        `deleteTicket failed: ${error?.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }
}
