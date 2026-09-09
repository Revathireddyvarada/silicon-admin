import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('tokens')
export class Token {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── Owner ──────────────────────────────────────────────
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // ── Refresh token identity ─────────────────────────────
  @Index()
  @Column({ name: 'refresh_jti', type: 'varchar', length: 36, unique: true })
  refreshJti!: string;

  @Column({ name: 'refresh_expires_at', type: 'timestamptz' })
  refreshExpiresAt!: Date;

  // ── Access token blocklist ─────────────────────────────
  // Populated on logout — guard rejects this jti until it naturally expires
  @Index()
  @Column({ name: 'blocked_access_jti', type: 'varchar', length: 36, nullable: true })
  blockedAccessJti!: string | null;

  @Column({ name: 'blocked_access_expires_at', type: 'timestamptz', nullable: true })
  blockedAccessExpiresAt!: Date | null;

  // ── Meta ───────────────────────────────────────────────
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}