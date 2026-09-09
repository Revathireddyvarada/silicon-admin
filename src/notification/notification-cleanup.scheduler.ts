import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { NotificationService } from "./notification.service";

/** Hard-deletes in-app notification rows older than NOTIFICATION_RETENTION_DAYS (default 3). */
@Injectable()
export class NotificationCleanupScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationCleanupScheduler.name);
  private timer?: ReturnType<typeof setInterval>;
  private bootTimer?: ReturnType<typeof setTimeout>;
  private running = false;

  constructor(private readonly notificationService: NotificationService) {}

  onModuleInit(): void {
    if (!this.isEnabled()) {
      this.logger.log("In-app notification cleanup disabled");
      return;
    }

    const days = this.retentionDays();
    this.logger.log(
      `In-app notification cleanup active retentionDays=${days} interval=6h`,
    );

    // First pass shortly after boot, then every 6 hours.
    this.bootTimer = setTimeout(() => void this.run(), 30_000);
    this.timer = setInterval(() => void this.run(), 6 * 60 * 60 * 1000);
  }

  onModuleDestroy(): void {
    if (this.bootTimer) clearTimeout(this.bootTimer);
    if (this.timer) clearInterval(this.timer);
  }

  private isEnabled(): boolean {
    return process.env.NOTIFICATION_CLEANUP_ENABLED !== "false";
  }

  private retentionDays(): number {
    const raw = Number(process.env.NOTIFICATION_RETENTION_DAYS);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 3;
  }

  private async run(): Promise<void> {
    if (!this.isEnabled()) return;
    if (this.running) {
      this.logger.warn("Notification cleanup skipped — previous run still in progress");
      return;
    }

    this.running = true;
    try {
      const result = await this.notificationService.purgeOlderThan(
        this.retentionDays(),
      );
      this.logger.log(
        `Notification cleanup done userNotifications=${result.userNotifications} notifications=${result.notifications}`,
      );
    } catch (err) {
      this.logger.warn(
        `Notification cleanup failed: ${(err as Error).message}`,
      );
    } finally {
      this.running = false;
    }
  }
}
