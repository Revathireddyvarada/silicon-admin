import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

export type UploadSide = "front" | "back" | "both_side";

@Entity("driver_document_types")
export class DriverDocumentType {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "document_name", type: "text" })
  documentName!: string;

  @Column({ name: "document_number", type: "boolean", default: false })
  documentNumber!: boolean;

  @Column({ name: "expiry_date", type: "boolean", default: false })
  expiryDate!: boolean;

  @Column({
    name: "upload_side",
    type: "varchar",
    length: 20,
    enum: ["front", "back", "both_side"],
    nullable: true,
  })
  uploadSide?: UploadSide | null;

  @Column({ name: "is_mandatory", type: "boolean", default: false })
  isMandatory!: boolean;

  @Column({ name: "status", type: "boolean", default: false })
  status!: boolean;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  isDeleted!: boolean;

  @Column({ name: "parent_id", type: "uuid", nullable: true })
  parentId?: string | null;

  @ManyToOne(() => DriverDocumentType, (doc) => doc.children, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "parent_id" })
  parent?: DriverDocumentType | null;

  @OneToMany(() => DriverDocumentType, (doc) => doc.parent)
  children?: DriverDocumentType[];

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy?: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}