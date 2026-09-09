import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUrl,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";


export class UpsertSiteSettingsDto {
  @ApiPropertyOptional({
    example: "https://example.com/logo.png",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "logoUrl must be a string" })
  logoUrl?: string;

  @ApiPropertyOptional({
    example: "https://example.com/favicon.ico",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "faviconUrl must be a string" })
  faviconUrl?: string;

  @ApiPropertyOptional({ example: "SiliconDrive", type: String })
  @IsOptional()
  @IsString({ message: "siteName must be a string" })
  @IsNotEmpty({ message: "siteName cannot be empty" })
  siteName?: string;

  @ApiPropertyOptional({ example: "© 2025 SiliconDrive", type: String })
  @IsOptional()
  @IsString({ message: "footerText must be a string" })
  footerText?: string;

  @ApiPropertyOptional({ example: "SiliconDrive | Best Rides", type: String })
  @IsOptional()
  @IsString({ message: "metaTitle must be a string" })
  metaTitle?: string;

  @ApiPropertyOptional({ example: "ride, taxi, silicon", type: String })
  @IsOptional()
  @IsString({ message: "metaKeywords must be a string" })
  metaKeywords?: string;

  @ApiPropertyOptional({ example: "Best ride platform", type: String })
  @IsOptional()
  @IsString({ message: "metaDescription must be a string" })
  metaDescription?: string;

  @ApiPropertyOptional({ example: "+919876543210", type: String })
  @IsOptional()
  @IsString({ message: "mobileNumber must be a string" })
  mobileNumber?: string;

  @ApiPropertyOptional({ example: "info@silicondrive.com", type: String })
  @IsOptional()
  @IsEmail({}, { message: "email must be a valid email" })
  email?: string;

  @ApiPropertyOptional({
    example: "https://twitter.com/silicondrive",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "twitterUrl must be a string" })
  twitterUrl?: string;

  @ApiPropertyOptional({
    example: "https://linkedin.com/company/silicondrive",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "linkedinUrl must be a string" })
  linkedinUrl?: string;

  @ApiPropertyOptional({
    example: "https://facebook.com/silicondrive",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "facebookUrl must be a string" })
  facebookUrl?: string;

  @ApiPropertyOptional({
    example: "https://youtube.com/silicondrive",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "youtubeUrl must be a string" })
  youtubeUrl?: string;

  @ApiPropertyOptional({ example: "+911800123456", type: String })
  @IsOptional()
  @IsString({ message: "helplineNumber must be a string" })
  helplineNumber?: string;

  @ApiPropertyOptional({
    example: "https://play.google.com/store/apps/details?id=com.silicondrive",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "androidPlaystoreUrl must be a string" })
  androidPlaystoreUrl?: string;

  @ApiPropertyOptional({
    example: "https://apps.apple.com/app/silicondrive",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "iosAppstoreUrl must be a string" })
  iosAppstoreUrl?: string;

  @ApiPropertyOptional({ example: "AIzaSyXXXXXXXXXXXXXX", type: String })
  @IsOptional()
  @IsString({ message: "googleMapsApiKey must be a string" })
  googleMapsApiKey?: string;

  @ApiPropertyOptional({ example: "G-XXXXXXXXXX", type: String })
  @IsOptional()
  @IsString({ message: "googleAnalyticsCode must be a string" })
  googleAnalyticsCode?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: "status must be a boolean" })
  status?: boolean;
}
