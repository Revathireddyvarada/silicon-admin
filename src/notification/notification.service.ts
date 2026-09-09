import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Notification } from "../entities/notification.entity";
import { UserNotification } from "../entities/user-notification.entity";
import { CreateNotificationDto, NotificationQueryDto } from "./dto/notification.dto";
import { User, UserType } from "../entities/user.entity";
import { RealtimeHttpService } from "../realtime/realtime-http.service";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,

    @InjectRepository(UserNotification)
    private readonly userNotificationRepo: Repository<UserNotification>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly realtimeHttp: RealtimeHttpService,
  ) { }

  /** Maps role name strings coming from outside to our internal UserType enum values */
  private roleNamesToUserTypes(roleNames: string[]): UserType[] {
    const map: Record<string, UserType> = {
      SUPER_ADMIN: UserType.SUPER_ADMIN,
      ADMIN: UserType.ADMIN,
      STAFF: UserType.STAFF,
    };
    return roleNames
      .map((r) => map[r.toUpperCase()])
      .filter((v): v is UserType => v !== undefined);
  }

  async create(
    dto: CreateNotificationDto,
    options?: { pushLive?: boolean },
  ): Promise<Notification> {
    const message = (dto.message ?? "").trim();
    if (!message) {
      throw new BadRequestException("message is required");
    }

    const notification = this.notificationRepo.create({
      notificationType: dto.notificationType.toUpperCase().trim(),
      title: dto.title.trim(),
      message,
      isDeleted: false,
      creatorType: dto.creatorType ?? null,
      createdBy: dto.creatorId ?? null,
      tripId: dto.tripId ?? null,
      ticketId: dto.ticketId ?? null,
      vendorId: dto.vendorId ?? null,
      vendorCode: dto.vendorCode ?? null,
      userId: dto.userId ?? null,
    });
    const saved = await this.notificationRepo.save(notification);

    // ── Resolve recipient user IDs ────────────────────────────────────────────
    let recipientIds: string[];

    if (dto.recipientIds && dto.recipientIds.length > 0) {
      recipientIds = [...new Set(dto.recipientIds.map((id) => id.trim()).filter(Boolean))];
    } else if (dto.recipientRoles && dto.recipientRoles.length > 0) {
      // Caller specified roles → find all active users with those roles
      const userTypes = this.roleNamesToUserTypes(dto.recipientRoles);
      const users = await this.userRepo.find({
        where: { userType: In(userTypes), isDeleted: false },
        select: ["id"],
      });
      recipientIds = users.map((u) => u.id);
    } else {
      // No filter → send to ALL active users
      const allUsers = await this.userRepo.find({
        where: { isDeleted: false },
        select: ["id"],
      });
      recipientIds = allUsers.map((u) => u.id);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const userNotifications = recipientIds.map((userId) =>
      this.userNotificationRepo.create({
        notificationId: saved.id,
        userId,
        isRead: false,
        isDeleted: false,
      }),
    );
    const savedUserNotifications = await this.userNotificationRepo.save(userNotifications);

    // Trip Kafka events are already socket-pushed by realtime-service.
    // HTTP to REALTIME_SERVICE_URL (often the public gateway) 429s/timeouts on bursts.
    if (options?.pushLive !== false) {
      void this.realtimeHttp
        .emitUserNotifications(
          savedUserNotifications
            .filter((un) => !!un.userId)
            .map((un) => ({
              userId: un.userId as string,
              userNotificationId: un.id,
              notificationId: saved.id,
              notificationType: saved.notificationType,
              title: saved.title,
              message: saved.message,
              tripId: saved.tripId,
              ticketId: saved.ticketId,
              vendorId: saved.vendorId,
              vendorCode: saved.vendorCode,
              isRead: false,
              createdAt: saved.createdAt,
            })),
        )
        .catch((err) =>
          this.logger.warn(
            `Realtime emit failed notification=${saved.id}: ${(err as Error).message}`,
          ),
        );
    }

    return saved;
  }
  async findPaginated(
    currentUserId: string,
    query: NotificationQueryDto,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.userNotificationRepo
      .createQueryBuilder("un")
      .innerJoinAndSelect("un.notification", "n")
      .where("un.userId = :userId", { userId: currentUserId })
      .andWhere("un.isDeleted = false")
      .andWhere("n.isDeleted = false");

    // Explicit check: `isRead === false` must still apply (do not use truthiness).
    // Also accept string forms in case transform was skipped.
    const rawIsRead = query.isRead as unknown;
    let isReadFilter: boolean | undefined;
    if (typeof rawIsRead === "boolean") {
      isReadFilter = rawIsRead;
    } else if (rawIsRead === "true" || rawIsRead === "1") {
      isReadFilter = true;
    } else if (rawIsRead === "false" || rawIsRead === "0") {
      isReadFilter = false;
    }
    if (typeof isReadFilter === "boolean") {
      qb.andWhere("un.isRead = :isRead", { isRead: isReadFilter });
    }

    if (query.search) {
      qb.andWhere(
        "(n.title ILIKE :search OR n.message ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy("un.createdAt", "DESC").skip(skip).take(limit);

    const [rows, total] = await qb.getManyAndCount();

    const unreadCount = await this.userNotificationRepo.count({
      where: { userId: currentUserId, isRead: false, isDeleted: false },
    });

    const data = rows.map((un) => ({
      userNotificationId: un.id,
      notificationId: un.notificationId,
      notificationType: un.notification.notificationType,
      title: un.notification.title,
      message: un.notification.message,
      tripId: un.notification.tripId,
      ticketId: un.notification.ticketId,
      vendorId: un.notification.vendorId,
      vendorCode: un.notification.vendorCode,
      userId: un.notification.userId,
      isRead: un.isRead,
      createdAt: un.notification.createdAt,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit), unreadCount };
  }

  async getUnreadCount(currentUserId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.userNotificationRepo.count({
      where: { userId: currentUserId, isRead: false, isDeleted: false },
    });
    return { unreadCount };
  }

  async markAsRead(
    userNotificationId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const un = await this.userNotificationRepo.findOne({
      where: { id: userNotificationId, userId: currentUserId, isDeleted: false },
    });
    if (!un) throw new NotFoundException(`Notification not found`);
    un.isRead = true;
    await this.userNotificationRepo.save(un);
    return { message: "Notification marked as read" };
  }

  async markAllAsRead(currentUserId: string): Promise<{ message: string }> {
    await this.userNotificationRepo
      .createQueryBuilder()
      .update(UserNotification)
      .set({ isRead: true })
      .where("userId = :userId AND isRead = false AND isDeleted = false", {
        userId: currentUserId,
      })
      .execute();
    return { message: "All notifications marked as read" };
  }

  async remove(
    userNotificationId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const un = await this.userNotificationRepo.findOne({
      where: { id: userNotificationId, userId: currentUserId, isDeleted: false },
    });
    if (!un) throw new NotFoundException(`Notification not found`);
    un.isDeleted = true;
    await this.userNotificationRepo.save(un);
    return { message: "Notification deleted successfully" };
  }

  async removeAll(currentUserId: string): Promise<{ message: string }> {
    await this.userNotificationRepo
      .createQueryBuilder()
      .update(UserNotification)
      .set({ isDeleted: true })
      .where("userId = :userId AND isDeleted = false", {
        userId: currentUserId,
      })
      .execute();
    return { message: "All notifications deleted successfully" };
  }

  /** Hard-delete recipient + event rows older than `days` (default 3). */
  async purgeOlderThan(
    days: number = 3,
  ): Promise<{ userNotifications: number; notifications: number }> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const userResult = await this.userNotificationRepo
      .createQueryBuilder()
      .delete()
      .from(UserNotification)
      .where("created_at < :cutoff", { cutoff })
      .execute();

    const notificationResult = await this.notificationRepo
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where("created_at < :cutoff", { cutoff })
      .execute();

    return {
      userNotifications: userResult.affected ?? 0,
      notifications: notificationResult.affected ?? 0,
    };
  }
}