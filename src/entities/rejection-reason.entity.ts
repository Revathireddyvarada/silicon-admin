import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("rejection_reasons")
export class RejectionReason {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({
    name: "display_id",
    type: "varchar",
    length: 200,
    nullable: true,
    unique: true,
  })
  displayId!: string | null;

  @Column({ name: "reason", type: "text" })
  reason!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  isDeleted!: boolean;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy!: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
