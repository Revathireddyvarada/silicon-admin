import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { State } from "./state.entity";
import { ApiHideProperty } from "@nestjs/swagger";
import { PricingTier } from "./pricing-tier.entity";

@Entity("cities")
export class City {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "city_name", type: "varchar", length: 255 })
  city_name!: string;

  @Column({ name: "state_id", type: "uuid" })
  state_id!: string;

  @ManyToOne(() => State, { onDelete: "CASCADE" })
  @ApiHideProperty()
  @JoinColumn({ name: "state_id" })
  state!: State;

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

  // @OneToMany(() => PricingTier, (pt) => pt.city)
  // pricingTiers!: PricingTier[];

}