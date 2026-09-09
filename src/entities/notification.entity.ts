import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { UserNotification } from "./user-notification.entity";

@Entity("notification_events")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", name: "notification_type" })
  notificationType!: string; // e.g. "TRIP_ACCEPTED", "TRIP_CANCELLED"

  @Column({ type: "text" })
  title!: string; // e.g. "Trip Accepted"

  @Column({ type: "text" })
  message!: string; // e.g. "Your trip ID #TRP10245 has been accepted..."

  @Column({ type: "uuid", nullable: true, name: "trip_id" })
  tripId!: string | null;

  @Column({ type: "uuid", nullable: true, name: "ticket_id" })
  ticketId!: string | null;

  @Column({ type: "uuid", nullable: true, name: "vendor_id" })
  vendorId!: string | null;
 
  @Column({ type: "varchar", nullable: true,  length: 20, name: "vendor_code" })
  vendorCode!: string | null;

  @Column({ type: "text", nullable: true, name: "user_id" })
  userId!: string | null;
  
  @Column({ type: "text", name: "creator_type", nullable: true })
  creatorType!: string | null;

  @Column({ type: "uuid", nullable: true, name: "created_by" })
  createdBy!: string | null;

  @Column({ type: "boolean", default: false, name: "is_deleted" })
  isDeleted!: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => UserNotification, (un) => un.notification)
  userNotifications!: UserNotification[];
}