import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type CommissionType = "percentage" | "fixed";
export type NightChargeType = "percentage" | "fixed";

@Entity("b2c_trip_settings")
export class B2cTripSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "wait_charge_per_min",
    type: "numeric",
    precision: 10,
    scale: 2,
  })
  waitChargePerMin!: number;

  @Column({ name: "free_wait_time_min", type: "integer" })
  freeWaitTimeMin!: number;

  @Column({
    name: "commission_type",
    type: "text",
    enum: ["percentage", "fixed"],
  })
  commissionType!: CommissionType;

  @Column({
    name: "driver_commission",
    type: "numeric",
    precision: 10,
    scale: 2,
  })
  driverCommission!: number;

  @Column({
    name: "night_charge_type",
    type: "text",
    enum: ["percentage", "fixed"],
    nullable: true,
  })
  nightChargeType?: NightChargeType | null;

  @Column({
    name: "night_charge_value",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  nightChargeValue?: number | null;

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
