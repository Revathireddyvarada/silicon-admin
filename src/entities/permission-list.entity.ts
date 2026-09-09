import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("permission_list")
export class PermissionList {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "public_id", type: "varchar", length: 255, unique: true })
  publicId!: string;

  @Column({ name: "role_id", type: "uuid" })
  roleId!: string;

  @Column({ name: "module_id", type: "uuid" })
  moduleId!: string;

  @Column({ name: "is_add", type: "boolean", default: false })
  isAdd!: boolean;

  @Column({ name: "is_list", type: "boolean", default: false })
  isList!: boolean;

  @Column({ name: "is_edit", type: "boolean", default: false })
  isEdit!: boolean;

  @Column({ name: "is_delete", type: "boolean", default: false })
  isDelete!: boolean;

  @Column({ name: "is_view", type: "boolean", default: false })
  isView!: boolean;

  // @Column({ name: "is_reply", type: "boolean", default: false })
  // isReply!: boolean;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  isDeleted!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

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
