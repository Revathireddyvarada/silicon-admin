import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("states")
export class State {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "state_name", type: "varchar", length: 255 })
  state_name!: string;

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

  // @ManyToOne(() => Country, (c) => c.states, { onDelete: "CASCADE" })
  // @JoinColumn({ name: "country_id" })
  // country!: Country;
}
