import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from "typeorm";

@Entity("vehicle_types")
@Index(
  "unique_vehicle_type_active",
  ["vehicle_type_name", "type", "seat_count"],
  {
    unique: true,
    where: `"is_deleted" = false`,
  }
)
export class VehicleType {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "vehicle_type_name", type: "varchar", length: 255 })
  vehicle_type_name!: string;

  @Column({ name: "type", type: "enum", enum: ["ac", "non_ac"], enumName: "vehicle_type_enum" })
  type!: "ac" | "non_ac";

  @Column({ name: "seat_count", type: "integer", default: 4 })
  seat_count!: number;

  @Column({ name: "status", type: "boolean", default: true })
  status!: boolean;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  is_deleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  created_by!: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updated_by!: string | null;

  // @OneToMany(() => PricingTier, (pt) => pt.vehicleType)
  // pricingTiers!: PricingTier[];
}
