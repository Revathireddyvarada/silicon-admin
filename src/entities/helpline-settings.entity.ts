import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("helpline_settings")
export class HelplineSettings {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "helpline_number", type: "text", nullable: true })
  helplineNumber!: string;

  @Column({ name: "police_helpline", type: "text", nullable: true })
  policeHelpline!: string;

  @Column({ name: "ambulance_helpline", type: "text", nullable: true })
  ambulanceHelpline!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
