import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("cms")
export class Cms {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "title", type: "text" })
  title!: string;

  @Column({ name: "url_index", type: "text" })
  urlIndex!: string;

  @Column({ name: "description", type: "text" })
  description!: string;

  @Column({ name: "meta_key", type: "text" })
  metaKey!: string;

  @Column({ name: "meta_description", type: "text" })
  metaDescription!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "is_delete", type: "boolean", default: false })
  isDelete!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
