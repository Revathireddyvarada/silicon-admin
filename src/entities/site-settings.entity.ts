import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("site_settings")
export class SiteSettings {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "logo_url", type: "text", nullable: true })
  logoUrl?: string | null;

  @Column({ name: "favicon_url", type: "text", nullable: true })
  faviconUrl?: string | null;

  @Column({ name: "site_name", type: "text", nullable: true })
  siteName?: string | null;

  @Column({ name: "footer_text", type: "text", nullable: true })
  footerText?: string | null;

  @Column({ name: "meta_title", type: "text", nullable: true })
  metaTitle?: string | null;

  @Column({ name: "meta_keywords", type: "text", nullable: true })
  metaKeywords?: string | null;

  @Column({ name: "meta_description", type: "text", nullable: true })
  metaDescription?: string | null;

  @Column({ name: "mobile_number", type: "text", nullable: true })
  mobileNumber?: string | null;

  @Column({ name: "email", type: "text", nullable: true })
  email?: string | null;

  @Column({ name: "twitter_url", type: "text", nullable: true })
  twitterUrl?: string | null;

  @Column({ name: "linkedin_url", type: "text", nullable: true })
  linkedinUrl?: string | null;

  @Column({ name: "facebook_url", type: "text", nullable: true })
  facebookUrl?: string | null;

  @Column({ name: "youtube_url", type: "text", nullable: true })
  youtubeUrl?: string | null;

  @Column({ name: "helpline_number", type: "text", nullable: true })
  helplineNumber?: string | null;

  @Column({ name: "android_playstore_url", type: "text", nullable: true })
  androidPlaystoreUrl?: string | null;

  @Column({ name: "ios_appstore_url", type: "text", nullable: true })
  iosAppstoreUrl?: string | null;

  @Column({ name: "google_maps_api_key", type: "text", nullable: true })
  googleMapsApiKey?: string | null;

  @Column({ name: "google_analytics_code", type: "text", nullable: true })
  googleAnalyticsCode?: string | null;

  @Column({ name: "status", type: "boolean", default: true })
  status!: boolean;

  @Column({ name: "is_deleted", type: "boolean", default: false })
  isDeleted!: boolean;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy?: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
