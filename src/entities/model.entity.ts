import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Brand } from "./brand.entity";

@Entity("models")
export class Model {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ type: "varchar", length: 255 })
  model_name!: string;

  @Column({ type: "uuid" })
  brand_id!: string;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: "brand_id" })
  brand!: Brand;

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