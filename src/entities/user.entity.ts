import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum UserType {
  SUPER_ADMIN = 1,
  ADMIN = 2,
  STAFF = 3,
}

export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  SUSPENDED = 3,
  DELETED = 4,
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

@Entity("users")
export class User {
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

  @Column({ name: "first_name", type: "varchar", length: 255 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 255, nullable: true })
  lastName!: string | null;

  @Column({ name: "role_id", type: "uuid", nullable: true })
  roleId!: string | null;

  @Column({
    name: "phone_country_code",
    type: "varchar",
    length: 10,
    nullable: true,
  })
  phoneCountryCode!: string | null;

  @Column({ name: "phone_number", type: "varchar", length: 20, nullable: true })
  phoneNumber!: string | null;

  @Index()
  @Column({ type: "varchar", unique: true, length: 255 })
  email!: string;

  @Column({ name: "gender", type: "integer", nullable: true })
  gender!: number | null;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ name: "date_of_joined", type: "date", nullable: true })
  dateOfJoined!: Date | null;

  @Column({
    name: "address_line_1",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  addressLine1!: string | null;

  @Column({
    name: "address_line_2",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  addressLine2!: string | null;

  @Column({ name: "city_id", type: "uuid", nullable: true })
  cityId!: string | null;

  @Column({ name: "state_id", type: "uuid", nullable: true })
  stateId!: string | null;

  @Column({ name: "pin_code", type: "varchar", length: 20, nullable: true })
  pinCode!: string | null;

  @Column({ name: "image", type: "varchar", length: 255, nullable: true })
  image!: string | null;

  @Column({ name: "user_type", type: "smallint", default: UserType.STAFF })
  userType!: UserType;

  @Column({
    name: "resetpassword_token",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  resetPasswordToken!: string | null;

  @Column({
    name: "resetpassword_expires",
    type: "timestamptz",
    nullable: true,
  })
  resetPasswordExpires!: Date;

  @Column({ name: "last_login_at", type: "timestamptz", nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  isDeleted!: boolean;

  @Column({
    name: "is_temporary_password",
    type: "boolean",
    default: false,
  })
  isTemporaryPassword!: boolean;

  @Column({
    name: "status",
    type: "smallint",
    nullable: false,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy!: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
