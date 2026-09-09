import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("brands")
export class Brand {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ type: "varchar", length: 255 })
  brand_name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "status", type: "boolean", default: true })
  status!: boolean;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  is_deleted!: boolean;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  created_by!: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updated_by!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}