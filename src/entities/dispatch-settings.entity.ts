import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("dispatch_settings")
export class DispatchSettings {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "geo_search_radius_km", type: "integer", default: 0 })
  geoSearchRadiusKm!: number;

  @Column({ name: "pickup_eta_speed_kmh", type: "integer", default: 0 })
  pickupEtaSpeedKmh!: number;

  @Column({ name: "pickup_eta_buffer_minutes", type: "integer", default: 0 })
  pickupEtaBufferMinutes!: number;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
