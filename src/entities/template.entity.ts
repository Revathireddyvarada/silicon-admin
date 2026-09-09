import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type DeliveryMethod = "email" | "sms" | "mobile_push_notification";

@Entity("template")
export class Template {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({
    name: "delivery_method",
    type: "varchar",
    length: 50,
    enum: ["email", "sms", "mobile_push_notification"],
  })
  deliveryMethod!: DeliveryMethod;

  @Column({ name: "template_name", type: "text" })
  templateName!: string;

  @Column({ name: "subject", type: "text" })
  subject!: string;

  @Column({ name: "message", type: "text" })
  message!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

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
}
