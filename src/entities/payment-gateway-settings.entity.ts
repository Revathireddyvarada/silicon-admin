import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type PaymentGatewayMode = "sandbox" | "live";

@Entity("payment_gateway_settings")
export class PaymentGatewaySettings {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "provider", type: "text", default: "razorpay" })
  provider!: string;

  @Column({
    name: "mode",
    type: "varchar",
    length: 20,
    enum: ["sandbox", "live"],
    default: "sandbox",
  })
  mode!: PaymentGatewayMode;

  @Column({ name: "merchant_id", type: "text" })
  merchantId!: string;

  @Column({ name: "merchant_key", type: "text" })
  merchantKey!: string;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
