import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Notification } from "../entities/send-notification.entity";
import { NotificationRecipient } from "../entities/notification-recipient.entity";
import { Template } from "../entities/template.entity";
import {
  SendnotificationDto,
  NotificationQueryDto,
} from "./dto/send-notification.dto";
import { RecipientStatus } from "../entities/notification-recipient.entity";
import { UserFetchService, RemoteUser } from "./user-fetch.service";
import { User } from "../entities/user.entity";
import {
  NotificationClientService,
  EmailRecipient,
} from "./notification-client.service";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,

    @InjectRepository(NotificationRecipient)
    private readonly recipientRepo: Repository<NotificationRecipient>,

    @InjectRepository(Template)
    private readonly templateRepo: Repository<Template>,

    private readonly notificationClient: NotificationClientService,

    private readonly userFetchService: UserFetchService,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private async generateDisplayId(): Promise<string> {
    const result = await this.dataSource.query(
      `SELECT CONCAT('NT-', LPAD(nextval('notification_display_seq')::text, 3, '0')) AS display_id`,
    );
    return result[0].display_id;
  }

  private async getRecipients(
    notificationId: string,
    userType: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: object[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [rows, total] = await this.recipientRepo.findAndCount({
      where: { notificationId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (!rows.length) return { data: [], total: 0, page, limit, totalPages: 0 };

    const ids = rows.map((r) => r.recipientId);
    const users = await this.userFetchService.fetchByIds(userType, ids);

    const data = rows.map((row) => {
      const user = users.find((u) => u.id === row.recipientId);
      return {
        recipientId: row.recipientId,
        status: row.status,
        createdAt: row.createdAt,
        name: user ? `${user.firstName} ${user.lastName ?? ""}`.trim() : null,
        email: user?.email ?? null,
        phoneNumber: user?.phoneNumber ?? null,
        phoneCountryCode: user?.phoneCountryCode ?? null,
        userType: user?.userType ?? userType,
      };
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async saveRecipients(
    notificationId: string,
    recipientIds: string[],
    status: RecipientStatus = "pending",
  ): Promise<void> {
    if (!recipientIds.length) return;

    const rows = recipientIds.map((recipientId) =>
      this.recipientRepo.create({ notificationId, recipientId, status }),
    );

    await this.recipientRepo.save(rows);
  }

  private async resolveUsers(
    userType: string,
    recipientIds?: string[],
  ): Promise<RemoteUser[]> {
    return this.userFetchService.resolveUsers(userType, recipientIds);
  }

  async send(
    dto: SendnotificationDto,
    currentUserId?: string,
  ): Promise<Notification> {
    const { subject, message } = dto;

    if (dto.templateId) {
      const template = await this.templateRepo.findOne({
        where: { id: dto.templateId, isDelete: false },
      });
      if (!template)
        throw new NotFoundException(`Template ${dto.templateId} not found`);
    }

    let recipientIds: string[] = [];
    if (dto.recipientIds && dto.recipientIds.length > 0) {
      recipientIds = dto.recipientIds;
    } else {
      const users = await this.userFetchService.resolveUsers(dto.userType);
      recipientIds = users.map((u) => u.id);
    }

    let recipientStatus: RecipientStatus = "sent";

    if (dto.notificationType === "email") {
      try {
        await this.handleEmailSend(dto, subject, message);
      } catch (error) {
        this.logger.error("Email sending failed", error);
        recipientStatus = "failed";
      }
    }

    const entity = this.repo.create({
      notificationType: dto.notificationType,
      displayId: await this.generateDisplayId(),
      userType: dto.userType,
      templateId: dto.templateId ?? null,
      subject,
      message,
      totalRecipients: recipientIds.length,
      isDelete: false,
      createdBy: currentUserId ?? null,
      updatedBy: currentUserId ?? null,
    });

    const saved = await this.repo.save(entity);

    if (recipientIds.length > 0) {
      await this.saveRecipients(saved.id, recipientIds, recipientStatus);
    }

    return saved;
  }

  private async handleEmailSend(
    dto: SendnotificationDto,
    subject: string,
    message: string,
  ): Promise<void> {
    const users: RemoteUser[] = await this.resolveUsers(
      dto.userType,
      dto.recipientIds,
    );

    if (!users.length) {
      this.logger.warn(`No users found for userType=${dto.userType}.`);
      return;
    }

    const validUsers = users.filter((u) => !!u.email);

    if (!validUsers.length) {
      this.logger.warn("No valid email addresses found.");
      return;
    }

    const recipients: EmailRecipient[] = validUsers.map((u) => ({
      to: u.email,
      recipientName: `${u.firstName} ${u.lastName ?? ""}`.trim(),
    }));

    if (recipients.length === 1) {
      await this.notificationClient.sendSingle(recipients[0], subject, message);
    } else {
      await this.notificationClient.sendBulk(recipients, subject, message);
    }

    this.logger.log(
      `Email dispatched to ${recipients.length} recipient(s) for userType=${dto.userType}`,
    );
  }

  async findAll(query: NotificationQueryDto): Promise<{
    data: object[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const sortFieldMap: Record<string, string> = {
      displayId: "displayId",
      notificationType: "notificationType",
      userType: "userType",
      totalRecipients: "totalRecipients",
      subject: "subject",
      createdAt: "createdAt",
    };

    const sortField = sortFieldMap[query.sortBy ?? "createdAt"] ?? "createdAt";
    const sortOrder: "ASC" | "DESC" =
      query.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const where: any = { isDelete: false };
    if (query.notificationType) where.notificationType = query.notificationType;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sortField]: sortOrder },
      skip,
      take: limit,
    });

    const result = await Promise.all(
      data.map(async (n) => {
        let templateName: string | null = null;
        if (n.templateId) {
          const template = await this.templateRepo.findOne({
            where: { id: n.templateId },
          });
          templateName = template?.templateName ?? null;
        }

        let sentBy: object | null = null;
        if (n.createdBy) {
          const user = await this.userRepo.findOne({
            where: { id: n.createdBy },
          });
          if (user) {
            sentBy = {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              image: user.image,
            };
          }
        }

        return { ...n, templateName, sentBy };
      }),
    );

    return {
      data: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUsersByType(userType: string): Promise<{ data: RemoteUser[] }> {
    const users = await this.userFetchService.fetchAllByType(userType);
    return { data: users };
  }

  async findOne(
    id: string,
    recipientPage = 1,
    recipientLimit = 10,
  ): Promise<object> {
    const entity = await this.repo.findOne({ where: { id, isDelete: false } });
    if (!entity) throw new NotFoundException(`Notification ${id} not found`);

    let templateName: string | null = null;
    if (entity.templateId) {
      const template = await this.templateRepo.findOne({
        where: { id: entity.templateId },
      });
      templateName = template?.templateName ?? null;
    }

    let sentBy: object | null = null;
    if (entity.createdBy) {
      const user = await this.userRepo.findOne({
        where: { id: entity.createdBy },
      });
      if (user) {
        sentBy = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
        };
      }
    }

    const recipients = await this.getRecipients(
      id,
      entity.userType,
      recipientPage,
      recipientLimit,
    );

    return {
      ...entity,
      templateName,
      sentBy,
      recipients,
    };
  }

  async remove(
    id: string,
    currentUserId?: string,
  ): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { id, isDelete: false } });
    if (!entity) throw new NotFoundException(`Notification ${id} not found`);

    await this.recipientRepo.delete({ notificationId: id });

    await this.repo.delete({ id });

    return { message: "Notification deleted successfully" };
  }
}
