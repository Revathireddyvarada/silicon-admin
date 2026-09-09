import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type RentalVehicleType = "mini" | "sedan" | "suv";

@Entity("rental_fare_settings")
export class RentalFareSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "vehicle_type",
    type: "text",
    enum: ["mini", "sedan", "suv"],
  })
  vehicleType!: RentalVehicleType;

  @Column({
    name: "non_ac_per_km",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  nonAcPerKm?: number | null;

  @Column({
    name: "ac_per_km",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  acPerKm?: number | null;

  @Column({
    name: "non_ac_per_hour",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  nonAcPerHour?: number | null;

  @Column({
    name: "ac_per_hour",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  acPerHour?: number | null;

  @Column({
    name: "extra_distance_fare_km",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  extraDistanceFareKm?: number | null;

  @Column({
    name: "extra_time_fare_min",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  extraTimeFareMin?: number | null;

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
