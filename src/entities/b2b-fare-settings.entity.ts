import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type PlatformFeeType = "amount" | "percentage";

@Entity("b2b_fare_settings")
export class B2bFareSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "gst_percentage", type: "numeric", precision: 5, scale: 2 })
  gstPercentage!: number;

  @Column({
    name: "platform_fee_type",
    type: "text",
    enum: ["amount", "percentage"],
  })
  platformFeeType!: PlatformFeeType;

  @Column({
    name: "platform_fee_value",
    type: "numeric",
    precision: 10,
    scale: 2,
  })
  platformFeeValue!: number;

  @Column({
    name: "no_show_driver_commission_above_500",
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 0,
  })
  noShowDriverCommissionAbove500!: number;

  @Column({
    name: "no_show_driver_commission_below_500",
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
  })
  noShowDriverCommissionBelow500!: number;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  isDeleted!: boolean;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy?: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}