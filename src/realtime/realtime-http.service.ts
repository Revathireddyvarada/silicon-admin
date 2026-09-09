import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class RealtimeHttpService {
  private readonly logger = new Logger(RealtimeHttpService.name);
  private readonly realtimeBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.realtimeBaseUrl =
      this.configService.get<string>("REALTIME_SERVICE_URL") ??
      "http://localhost:3011/api";
  }

  /** Emit in-app notifications to admin/staff users via realtime-service. */
  async emitUserNotifications(
    recipients: Array<{
      userId: string;
      userNotificationId: string;
      notificationId: string;
      notificationType: string;
      title: string;
      message: string;
      tripId?: string | null;
      ticketId?: string | null;
      isRead?: boolean;
      createdAt?: string | Date;
    }>,
  ): Promise<void> {
    if (!recipients.length) return;

    const payload = {
      recipients: recipients.map((r) => ({
        ...r,
        isRead: r.isRead ?? false,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : r.createdAt ?? new Date().toISOString(),
      })),
    };

    try {
      await axios.post(
        `${this.realtimeBaseUrl}/internal/socket/user-notification`,
        payload,
        { headers: { "Content-Type": "application/json" }, timeout: 8000 },
      );
      this.logger.log(
        `Realtime user notifications emitted count=${recipients.length}`,
      );
    } catch (error: any) {
      this.logger.warn(
        `Realtime user notification failed: ${
          error?.response?.data?.message || error.message
        }`,
      );
    }
  }
}
