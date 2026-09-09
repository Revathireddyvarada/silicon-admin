import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type VehicleType = "mini" | "sedan" | "suv";
export type AcType = "ac" | "non_ac";

@Entity("b2c_km_fare_settings")
export class B2cKmFareSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "km_range_from", type: "numeric", precision: 10, scale: 2 })
  kmRangeFrom!: number;

  @Column({
    name: "km_range_to",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  kmRangeTo?: number | null; 

  @Column({
    name: "vehicle_type",
    type: "text",
    enum: ["mini", "sedan", "suv"],
  })
  vehicleType!: VehicleType;

  @Column({ name: "ac_type", type: "text", enum: ["ac", "non_ac"] })
  acType!: AcType;

  @Column({ name: "amount_per_km", type: "numeric", precision: 10, scale: 2 })
  amountPerKm!: number;

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
