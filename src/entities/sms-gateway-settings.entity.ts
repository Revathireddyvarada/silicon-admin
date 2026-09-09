import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("sms_gateway_settings")
export class SmsGatewaySettings {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "provider", type: "text" })
  provider!: string;

  @Column({ name: "account_id", type: "text" })
  accountId!: string;

  @Column({ name: "token_number", type: "text" })
  tokenNumber!: string;

  @Column({ name: "account_number", type: "text" })
  accountNumber!: string;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
