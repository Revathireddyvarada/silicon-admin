import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "public_id", type: "varchar", length: 255, unique: true })
  publicId!: string;

  @Column({
    name: "display_id",
    type: "varchar",
    length: 200,
    nullable: true,
    unique: true,
  })
  displayId!: string | null;

  @Column({ name: "role_name", type: "varchar", length: 255 })
  roleName!: string;

  @Column({ name: "description", type: "varchar", length: 255, nullable: true })
  description!: string | null;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  isDeleted!: boolean;

  @Column({ name: "status", type: "boolean", default: true })
  status!: boolean;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy!: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
