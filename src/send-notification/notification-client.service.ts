import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export interface EmailRecipient {
  to: string;
  recipientName: string;
}

export interface DriverDocumentNotification {
  label: string;
  status: string;
  notes?: string;
}

export interface DriverNotificationRecipient {
  driverId: string;
  name: string;
  email?: string;
}

@Injectable()
export class NotificationClientService {
  private readonly logger = new Logger(NotificationClientService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl =
      process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:3009/api";
  }

  async sendSingle(
    recipient: EmailRecipient,
    subject: string,
    message: string,
  ): Promise<void> {
    await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/notify`, {
        channel: "email",
        recipient: recipient.to,
        subject,
        template: "admin-notification",
        message,
        data: { name: recipient.recipientName },
      }),
    );
    this.logger.log(`Single email dispatched → ${recipient.to}`);
  }

  async sendBulk(
    recipients: EmailRecipient[],
    subject: string,
    message: string,
  ): Promise<void> {
    await Promise.all(
      recipients.map((r) =>
        firstValueFrom(
          this.httpService.post(`${this.baseUrl}/notify`, {
            channel: "email",
            recipient: r.to,
            subject,
            template: "admin-notification",
            message,
            data: { name: r.recipientName },
          }),
        ),
      ),
    );
    this.logger.log(`Bulk email dispatched → ${recipients.length} recipients`);
  }

  async sendLoginCredential(
    recipient: EmailRecipient,
    password: string,
  ): Promise<void> {
    await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/notify`, {
        channel: "email",
        recipient: recipient.to,
        subject: "Welcome! Your Login Credentials",
        message: `Hi ${recipient.recipientName}, your account has been created.`,
        template: "welcome-staff",
        data: {
          name: recipient.recipientName,
          email: recipient.to,
          password,
        },
      }),
    );
    this.logger.log(`Login credential email sent → ${recipient.to}`);
  }

  async sendTicketAssigned(
    recipient: EmailRecipient,
    data: { ticketNo: string; subject: string },
  ): Promise<void> {
    await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/notify`, {
        channel: "email",
        recipient: recipient.to,
        subject: "New Ticket Assigned",
        message: `A new ticket (${data.ticketNo}) has been assigned to you.`,
        template: "ticket-assigned",
        data: {
          recipientName: recipient.recipientName,
          ticketNo: data.ticketNo,
          subject: data.subject,
        },
      }),
    );
    this.logger.log(`Ticket assigned email sent → ${recipient.to}`);
  }



    /**
   * Notifies a driver about a single document's status (rejected / clarification required).
   * Sends email (if the driver has one on file) and an in-app notification, per document.
   *
   * NOTE: `channel: "in_app"` / `recipientType: "driver"` is new — existing calls in this
   * file only ever use `channel: "email"`. Confirm the notification-service actually
   * supports this shape before relying on it in production.
   */
  async sendDriverDocumentStatusUpdate(
    driver: DriverNotificationRecipient,
    document: DriverDocumentNotification,
  ): Promise<void> {
    const subject = `Silicon Drive - Update on your ${document.label}`;
    const message = document.notes
      ? `Your ${document.label} has been marked "${document.status}". Reason: ${document.notes}`
      : `Your ${document.label} has been marked "${document.status}".`;

    const tasks: Promise<unknown>[] = [];

    if (driver.email) {
      tasks.push(
        firstValueFrom(
          this.httpService.post(`${this.baseUrl}/notify`, {
            channel: "email",
            recipient: driver.email,
            subject,
            template: "driver-document-status",
            message,
            data: {
              name: driver.name,
              documentLabel: document.label,
              status: document.status,
              notes: document.notes ?? "",
            },
          }),
        ),
      );
    } else {
      this.logger.warn(
        `No email on file for driver ${driver.driverId}; skipping email for ${document.label}`,
      );
    }

    tasks.push(
      firstValueFrom(
        this.httpService.post(`${this.baseUrl}/notify`, {
          channel: "in_app",
          recipient: driver.driverId,
          recipientType: "driver",
          subject,
          template: "driver-document-status",
          message,
          data: {
            documentLabel: document.label,
            status: document.status,
            notes: document.notes ?? "",
          },
        }),
      ),
    );

    const results = await Promise.allSettled(tasks);
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) {
      this.logger.warn(
        `${failed.length}/${results.length} notification channel(s) failed for driver=${driver.driverId} document=${document.label}`,
      );
    } else {
      this.logger.log(
        `Document status notification sent → driver=${driver.driverId} document=${document.label}`,
      );
    }
  }


    /**
   * Notifies a staff member that their role has been changed by an admin.
   */
  // async sendRoleChanged(
  //   recipient: EmailRecipient,
  //   data: { previousRoleName?: string | null; newRoleName: string },
  // ): Promise<void> {
  //   const message = data.previousRoleName
  //     ? `Hi ${recipient.recipientName}, your role has been changed from "${data.previousRoleName}" to "${data.newRoleName}".`
  //     : `Hi ${recipient.recipientName}, your role has been set to "${data.newRoleName}".`;

  //   await firstValueFrom(
  //     this.httpService.post(`${this.baseUrl}/notify`, {
  //       channel: "email",
  //       recipient: recipient.to,
  //       subject: "Your role has been updated",
  //       message,
  //       template: "staff-role-changed",
  //       data: {
  //         recipientName: recipient.recipientName,
  //         previousRoleName: data.previousRoleName ?? null,
  //         newRoleName: data.newRoleName,
  //       },
  //     }),
  //   );
  //   this.logger.log(`Role changed email sent → ${recipient.to}`);
  // }

  async sendRoleChanged(
  recipient: EmailRecipient,
  data: {
    previousRoleName?: string | null;
    newRoleName: string;
  },
): Promise<void> {
  const message = data.previousRoleName
    ? `Hi ${recipient.recipientName}, your role has been changed from "${data.previousRoleName}" to "${data.newRoleName}".`
    : `Hi ${recipient.recipientName}, your role has been set to "${data.newRoleName}".`;

  await firstValueFrom(
    this.httpService.post(`${this.baseUrl}/notify`, {
      channel: "email",
      recipient: recipient.to,
      subject: "Your Staff Role Has Been Changed",
      template: "staff-role-changed",
      message,
      data: {
        name: recipient.recipientName,
        oldRole: data.previousRoleName ?? "Not Assigned",
        newRole: data.newRoleName,
      },
    }),
  );

  this.logger.log(`Role changed email sent → ${recipient.to}`);
}


}
