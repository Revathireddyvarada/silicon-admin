import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApiHideProperty } from "@nestjs/swagger";
import { State } from "./state.entity";
import { City } from "./city.entity";

/** GeoJSON Polygon — coordinates are [lng, lat] rings. */
export type ZonePolygonGeoJson = {
  type: "Polygon";
  coordinates: number[][][];
};

/** Google Maps path points for redraw. */
export type ZoneLatLng = { lat: number; lng: number };

@Entity("zones")
export class Zone {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "zone_name", type: "varchar", length: 255 })
  zone_name!: string;

  @Column({ name: "state_id", type: "uuid" })
  state_id!: string;

  @ManyToOne(() => State, { onDelete: "RESTRICT" })
  @ApiHideProperty()
  @JoinColumn({ name: "state_id" })
  state!: State;

  @Column({ name: "city_id", type: "uuid" })
  city_id!: string;

  @ManyToOne(() => City, { onDelete: "RESTRICT" })
  @ApiHideProperty()
  @JoinColumn({ name: "city_id" })
  city!: City;

  /** GeoJSON Polygon for GIS / backend consumers. */
  @Column({ name: "polygon", type: "jsonb" })
  polygon!: ZonePolygonGeoJson;

  /** Same shape as Google Maps polygon path for admin redraw. */
  @Column({ name: "polygon_paths", type: "jsonb" })
  polygon_paths!: ZoneLatLng[];

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
}
