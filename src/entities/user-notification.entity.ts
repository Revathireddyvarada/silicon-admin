import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Notification } from "./notification.entity";

@Entity("user_notification")
export class UserNotification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "notification_id" })
  notificationId!: string;

  @Column({ type: "text", nullable: true, name: "user_id" })
  userId!: string | null;

  @Column({ type: "boolean", default: false, name: "is_read" })
  isRead!: boolean;

  @Column({ type: "boolean", default: false, name: "is_deleted" })
  isDeleted!: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => Notification, (n) => n.userNotifications)
  @JoinColumn({ name: "notification_id" })
  notification!: Notification;
}
