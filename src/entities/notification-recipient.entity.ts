import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Notification } from "./send-notification.entity";

export type RecipientStatus = "sent" | "failed" | "pending";

@Entity("notification_recipients")
export class NotificationRecipient {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "notification_id", type: "uuid" })
  notificationId!: string;

  @Column({ name: "recipient_id", type: "uuid" })
  recipientId!: string;
  @Column({
    name: "status",
    type: "varchar",
    length: 20,
    default: "pending",
  })
  status!: RecipientStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => Notification, (n) => n.recipients, { onDelete: "CASCADE" })
  @JoinColumn({ name: "notification_id" })
  notification!: Notification;
}
