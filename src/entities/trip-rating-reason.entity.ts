import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("trip_rating_reasons")
export class TripRatingReason {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "reason", type: "varchar", length: 255 })
  reason!: string;

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

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
