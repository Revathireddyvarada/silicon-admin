import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { City } from "./city.entity";
import { VehicleType } from "./vehicle-type.entity";

@Entity("pricing_tiers")
export class PricingTier {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "name", type: "varchar", length: 100 })
  name!: string;

  @Column({ name: "city_id", type: "uuid" })
  cityId!: string;

  // @ManyToOne(() => City, (city) => city.pricingTiers, { onDelete: "CASCADE" })
  // @JoinColumn({ name: "city_id" })
  // city!: City;

  @Column({ name: "vehicle_type_id", type: "uuid" })
  vehicleTypeId!: string;

  // @ManyToOne(() => VehicleType, (vt) => vt.pricingTiers, { onDelete: "CASCADE" })
  // @JoinColumn({ name: "vehicle_type_id" })
  // vehicleType!: VehicleType;

  @Column({ name: "base_fare", type: "decimal", precision: 12, scale: 2 })
  baseFare!: number;

  @Column({ name: "per_km_rate", type: "decimal", precision: 12, scale: 4 })
  perKmRate!: number;

  @Column({ name: "per_minute_rate", type: "decimal", precision: 12, scale: 4 })
  perMinuteRate!: number;

  @Column({ name: "currency", type: "varchar", length: 3, default: "INR" })
  currency!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
