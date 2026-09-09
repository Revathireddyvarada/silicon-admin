import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { NotificationRecipient } from "./notification-recipient.entity";

export type NotificationType = "email" | "mobile_notification";
export type UserType = "vendors" | "drivers" | "fleet_owners" | "b2c_customers";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({
    name: "display_id",
    type: "varchar",
    length: 200,
    nullable: true,
    unique: true,
  })
  displayId!: string | null;

  @Column({
    name: "notification_type",
    type: "varchar",
    length: 50,
    enum: ["email", "mobile_notification"],
  })
  notificationType!: NotificationType;

  @Column({
    name: "user_type",
    type: "varchar",
    length: 50,
    enum: ["vendors", "drivers", "fleet_owners", "b2c_customers"],
  })
  userType!: UserType;

  @Column({ name: "template_id", type: "uuid", nullable: true })
  templateId?: string | null;

  @Column({ name: "subject", type: "text" })
  subject!: string;

  @Column({ name: "message", type: "text" })
  message!: string;

  @Column({ name: "total_recipients", type: "int", default: 0 })
  totalRecipients!: number;

  @Column({ name: "is_delete", type: "boolean", default: false })
  isDelete!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy?: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy?: string | null;

  @OneToMany(() => NotificationRecipient, (r) => r.notification, {
    cascade: false,
    eager: false,
  })
  recipients!: NotificationRecipient[];
}
