export enum NotificationChannel {
  EMAIL = "EMAIL",
  PUSH = "PUSH",
  SMS = "SMS",
}

export interface EmailJobPayload {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export interface NotificationJob {
  channel: NotificationChannel;
  email?: EmailJobPayload;
}
