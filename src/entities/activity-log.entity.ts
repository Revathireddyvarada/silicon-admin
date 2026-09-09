import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("activity_log")
export class ActivityLog {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text" })
    action!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "text", name: "model_name" })
    modelName!: string;

    @Column({ type: "bigint", nullable: true, name: "record_id" })
    recordId!: number | null;

    @Column({ type: "boolean", default: false, name: "is_deleted" })
    isDeleted!: boolean;

    @Column({ type: "uuid", nullable: true, name: "created_by" })
    createdBy!: string | null;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}