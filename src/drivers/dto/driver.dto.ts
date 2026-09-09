// src/drivers/dto/register-driver.dto.ts
import {
  IsEmail,
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
  IsBoolean,
  ValidateNested,
  IsNumber,
  IsNotEmpty,
  IsArray,
  Allow,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// ─────────────────────────────────────────────────────────────────────────────
// RegisterDriverDto  (used by /register endpoint — unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export class  RegisterDriverDto {
  @ApiProperty({ example: "John", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "firstName is required" })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: "Doe", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "lastName is required" })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: "john.doe@example.com", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "email is required" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: "+1", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  phoneCountryCode?: string;

  @ApiProperty({ example: "+1234567890", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "mobile is required" })
  @IsString()
  mobile!: string;

  @ApiProperty({ example: "password123", minLength: 6, type: String })
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsNotEmpty({ message: "password is required" })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: "DL123456", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @ApiPropertyOptional({ example: "123 Main St", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  address?: string;
}



// ─────────────────────────────────────────────────────────────────────────────
// RegisterWithMobileDto  — NEW: only mobile required for registration
// ─────────────────────────────────────────────────────────────────────────────
export class RegisterWithMobileDto {
  @ApiProperty({ example: "+1234567890", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "mobile is required" })
  @IsString()
  mobile!: string;

  @ApiPropertyOptional({ example: "+91", type: String })
  @IsOptional()
  @IsString()
  phoneCountryCode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VerifyOtpDto  — NEW: verify OTP by mobile
// ─────────────────────────────────────────────────────────────────────────────
export class VerifyOtpDto {
  @ApiProperty({ example: "+1234567890", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "mobile is required" })
  @IsString()
  mobile!: string;

  @ApiProperty({ example: "672633", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "otp is required" })
  @IsString()
  otp!: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// DriverDetailsDto  — maps to snake_case payload fields → Driver entity
// ─────────────────────────────────────────────────────────────────────────────
export class DriverDetailsDto {
  @ApiPropertyOptional({ example: "John", type: String })
  @IsOptional() @IsString()
  first_name?: string;

  @ApiPropertyOptional({ example: "Doe", type: String })
  @IsOptional() @IsString()
  last_name?: string;


  @ApiPropertyOptional({ example: "uuid-of-city", type: String })
  @IsOptional()
  @IsString()
  city_id?: string;

  @ApiPropertyOptional({ example: "Bengaluru", type: String })
  @IsOptional()
  @IsString()
  city_name?: string;

  @ApiPropertyOptional({ example: "uuid-of-state", type: String })
  @IsOptional()
  @IsString()
  state_id?: string;

  @ApiPropertyOptional({ example: "Karnataka", type: String })
  @IsOptional()
  @IsString()
  state_name?: string;

  @ApiPropertyOptional({ example: "john.doe@example.com", type: String })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "+1", type: String })
  @IsOptional() @IsString()
  phone_country_code?: string;

  @ApiPropertyOptional({ example: "+1234567890", type: String })
  @IsOptional() @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/photo.jpg", type: String })
  @IsOptional() @IsString()
  user_image?: string;

  @ApiPropertyOptional({ example: "Male", type: String })
  @IsOptional() @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: "+10987654321", type: String })
  @IsOptional() @IsString()
  secondary_mobile?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 1 || value === "1" || value === "true" || value === "yes")
      return true;
    if (
      value === false ||
      value === 0 ||
      value === "0" ||
      value === "false" ||
      value === "no" ||
      value === "" ||
      value == null
    )
      return false;
    return value;
  })
  @IsBoolean()
  resident_of_karnataka?: boolean;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 1 || value === "1" || value === "true" || value === "yes")
      return true;
    if (
      value === false ||
      value === 0 ||
      value === "0" ||
      value === "false" ||
      value === "no" ||
      value === "" ||
      value == null
    )
      return false;
    return value;
  })
  @IsBoolean()
  do_you_know_kannada?: boolean;

  @ApiPropertyOptional({ example: "Hindi", type: String })
  @IsOptional() @IsString()
  additional_language?: string;

  @ApiPropertyOptional({ example: "123 Main St", type: String })
  @IsOptional() @IsString()
  addressline1?: string;

  @ApiPropertyOptional({ example: "Apt 4B", type: String })
  @IsOptional() @IsString()
  addressline2?: string;

  @ApiPropertyOptional({ example: "Bengaluru", type: String })
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "Karnataka", type: String })
  @IsOptional() @IsString()
  state?: string;

  @ApiPropertyOptional({ example: "560001", type: String })
  @IsOptional() @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  created_by?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  updated_by?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional() @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ example: "active", type: String })
  @IsOptional() @IsString()
  status?: string;

  @ApiPropertyOptional({ example: "single ", type: String })
  @IsOptional() @IsString()
  relationship_status?: string;
  
}

// ─────────────────────────────────────────────────────────────────────────────
// VehicleDetailsDto
// ─────────────────────────────────────────────────────────────────────────────
export class VehicleDetailsDto {
  @ApiPropertyOptional({ example: "KA01AB1234", type: String })
  @IsOptional()
  @IsString()
  vehicle_number?: string;

  @ApiPropertyOptional({ description: "Vehicle type ID (UUID)", example: "uuid", type: String })
  @IsOptional()
  @IsString()
  vehicle_type?: string;

  @ApiPropertyOptional({ description: "Vehicle brand ID (UUID)", example: "uuid", type: String })
  @IsOptional()
  @IsString()
  vehicle_brand?: string;

  @ApiPropertyOptional({ description: "Vehicle model ID (UUID)", example: "uuid", type: String })
  @IsOptional()
  @IsString()
  vehicle_model?: string;

  @ApiPropertyOptional({ example: "Toyota", type: String })
  @IsOptional()
  @IsString()
  vehicle_make?: string;

  @ApiPropertyOptional({ description: "Vehicle color ID (UUID)", example: "uuid", type: String })
  @IsOptional()
  @IsString()
  vehicle_color?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  taxi_board_installed?: boolean;

  @ApiPropertyOptional({ example: ["img1.jpg", "img2.jpg"], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })    // ← validates each item in array is a string
  vehicle_images?: string[];

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional()
  @IsString()
  created_by?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional()
  @IsString()
  updated_by?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ example: "active", type: String })
  @IsOptional()
  @IsString()
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VehicleDocumentDto
// ─────────────────────────────────────────────────────────────────────────────
export class VehicleDocumentDto {
  @ApiPropertyOptional({ example: "1HGCM82633A123456", type: String })
  @IsOptional() @IsString()
  vehicle_chessis_number?: string;

  // @ApiPropertyOptional({ example: "2025-12-31", type: String })
  // @IsOptional() @IsDateString()
  // rc_expiry_date?: string;
  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  rc_expiry_date?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional() @IsString()
  upload_rc_front_image?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional() @IsString()
  upload_rc_back_image?: string;

  @ApiPropertyOptional({ example: "INS123456", type: String })
  @IsOptional() @IsString()
  insurance_number?: string;

  // @ApiPropertyOptional({ example: "2025-12-31", type: String })
  // @IsOptional() @IsDateString()
  // insurance_expiry_date?: string;
  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  insurance_expiry_date?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional() @IsString()
  upload_insurance_document?: string;

  // @ApiPropertyOptional({ example: "2025-12-31", type: String })
  // @IsOptional() @IsDateString()
  // fc_expiry_date?: string;
  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  fc_expiry_date?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional() @IsString()
  upload_fc_document?: string;

  // @ApiPropertyOptional({ example: "2025-12-31", type: String })
  // @IsOptional() @IsDateString()
  // emition_puc_expiry_date?: string;
  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  emition_puc_expiry_date?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional() @IsString()
  upload_puc_document?: string;

  // @ApiPropertyOptional({ example: "2025-12-31", type: String })
  // @IsOptional() @IsDateString()
  // permit_expiry_date?: string;

  // @ApiPropertyOptional({ example: "url_or_path", type: String })
  // @IsOptional() @IsString()
  // upload_permit_document?: string;

  // @ApiPropertyOptional({ example: "2025-12-31", type: String })
  // @IsOptional() @IsDateString()
  // tax_expiry_date?: string;

  // @ApiPropertyOptional({ example: "url_or_path", type: String })
  // @IsOptional() @IsString()
  // upload_tax_document?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  permit_expiry_date?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional() @IsString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  upload_permit_document?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  tax_expiry_date?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional() @IsString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  upload_tax_document?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  created_by?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  updated_by?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional() @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ example: "active", type: String })
  @IsOptional() @IsString()
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// KycDocumentDto
// ─────────────────────────────────────────────────────────────────────────────
export class KycDocumentDto {
  @ApiPropertyOptional({ example: "DL1234567890", type: String })
  @IsOptional()
  @IsString()
  driving_licence_number?: string;

  // @ApiPropertyOptional({ example: "2020-01-01", type: String })
  // @IsOptional()
  // @IsDateString()
  // driving_licence_issued_date?: string;

  @ApiPropertyOptional({ example: "2020-01-01", type: String })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  driving_licence_issued_date?: string;

  // @ApiPropertyOptional({ example: "2030-01-01", type: String })
  // @IsOptional()
  // @IsDateString()
  // driving_licence_expiry_date?: string;

  @ApiPropertyOptional({ example: "2030-01-01", type: String })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  driving_licence_expiry_date?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional()
  @IsString()
  upload_driving_licence_front_image?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional()
  @IsString()
  upload_driving_licence_back_image?: string;

  @ApiPropertyOptional({ example: "EPIC123456", type: String })
  @IsOptional()
  @IsString()
  epic_card_number?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional()
  @IsString()
  upload_epic_card_document?: string;

  @ApiPropertyOptional({ example: "ABCDE1234F", type: String })
  @IsOptional()
  @IsString()
  pan_card_number?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional()
  @IsString()
  upload_pan_card?: string;

  @ApiPropertyOptional({ example: "PVC123456", type: String })
  @IsOptional()
  @IsString()
  police_verification_file_number?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional()
  @IsString()
  upload_pvc_document?: string;

  @ApiPropertyOptional({ example: "MED123456", type: String })
  @IsOptional()
  @IsString()
  medical_certificate_number?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional()
  @IsString()
  upload_medical_certificate?: string;

  @ApiPropertyOptional({ example: "BG123456", type: String })
  @IsOptional()
  @IsString()
  background_verification_id?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional()
  @IsString()
  upload_background_verification_document?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional()
  @IsString()
  created_by?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional()
  @IsString()
  updated_by?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ example: "active", type: String })
  @IsOptional()
  @IsString()
  status?: string;

  // @ApiPropertyOptional({ example: "2026-05-27", type: String })
  // @IsOptional()
  // @IsDateString()
  // medical_certificate_expiry_date?: string;

  @ApiPropertyOptional({ example: "2026-05-27", type: String })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  medical_certificate_expiry_date?: string;

  // @ApiPropertyOptional({ example: "2026-05-31", type: String })
  // @IsOptional()
  // @IsDateString()
  // background_verification_expiry_date?: string;
  @ApiPropertyOptional({ example: "2026-05-31", type: String })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  background_verification_expiry_date?: string;

  // @ApiPropertyOptional({ example: "2026-05-21", type: String })
  // @IsOptional()
  // @IsDateString()
  // pvc_expiry_date?: string;

  @ApiPropertyOptional({ example: "2026-05-21", type: String })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === "" ? undefined : value))
  pvc_expiry_date?: string;

  @ApiPropertyOptional({ example: "Test", type: String })
  @IsOptional()
  @IsString()
  court_verification_notes?: string;

  @ApiPropertyOptional({ example: "verified", type: String })
  @IsOptional()
  @IsString()
  court_verification_status?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// AccountDetailsDto
// ─────────────────────────────────────────────────────────────────────────────
export class AccountDetailsDto {
  @ApiPropertyOptional({ example: "123456789012", type: String })
  @IsOptional() @IsString()
  bank_account_number?: string;

  @ApiPropertyOptional({ example: "John Doe", type: String })
  @IsOptional() @IsString()
  account_holder_name?: string;

  @ApiPropertyOptional({ example: "State Bank of India", type: String })
  @IsOptional() @IsString()
  bank_name?: string;

  @ApiPropertyOptional({ example: "SBIN0001234", type: String })
  @IsOptional() @IsString()
  ifsc_code?: string;

  @ApiPropertyOptional({ example: "Connaught Place", type: String })
  @IsOptional() @IsString()
  bank_branch?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional() @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  created_by?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  updated_by?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional() @IsBoolean()
  verified?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// EmergencyContactDto
// ─────────────────────────────────────────────────────────────────────────────
export class EmergencyContactDto {
  @ApiPropertyOptional({ example: "+10987654321", type: String })
  @IsOptional() @IsString()
  emergency_number?: string;

  @ApiPropertyOptional({ example: "personal", type: String })
  @IsOptional() @IsString()
  contact_type?: string;

  @ApiPropertyOptional({ example: "Jane Doe", type: String })
  @IsOptional() @IsString()
  contact_name?: string;

  @ApiPropertyOptional({ example: "Spouse", type: String })
  @IsOptional() @IsString()
  relationship?: string;

  @ApiPropertyOptional({ example: "123 Main St", type: String })
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  created_by?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  updated_by?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional() @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ example: "active", type: String })
  @IsOptional() @IsString()
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AadharDto
// ─────────────────────────────────────────────────────────────────────────────
export class AadharDto {
  @ApiPropertyOptional({ example: "1234-5678-9012", type: String })
  @IsOptional() @IsString()
  aadhar_number?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional() @IsString()
  upload_front_aadhar_document?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  @IsOptional() @IsString()
  upload_back_aadhar_document?: string;

  @ApiPropertyOptional({ example: "123456", type: String })
  @IsOptional() @IsString()
  aadhar_otp?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional() @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  created_by?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  updated_by?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional() @IsBoolean()
  verified?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// AddDriverPayloadDto  — used for JSON body (POST /drivers/add non-formdata)
// ─────────────────────────────────────────────────────────────────────────────
export class AddDriverPayloadDto {
  @ApiProperty({ description: "Driver main details", type: () => DriverDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverDetailsDto)
  drivers_details!: DriverDetailsDto;

  @ApiPropertyOptional({ description: "Vehicle details", type: () => VehicleDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDetailsDto)
  drivers_vehicle_details?: VehicleDetailsDto;

  @ApiPropertyOptional({ description: "Vehicle documents", type: () => VehicleDocumentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  driver_vehicle_documents?: VehicleDocumentDto;

  @ApiPropertyOptional({ description: "KYC document", type: () => KycDocumentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => KycDocumentDto)
  driver_kyc_document?: KycDocumentDto;

  @ApiPropertyOptional({ description: "Account details", type: () => AccountDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccountDetailsDto)
  drvice_account_details?: AccountDetailsDto;

  @ApiPropertyOptional({ description: "Emergency contact", type: () => [EmergencyContactDto] })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  driver_emergency?: EmergencyContactDto[];

  @ApiPropertyOptional({ description: "Aadhar details", type: () => AadharDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AadharDto)
  driver_aadhar?: AadharDto;
}

// ─────────────────────────────────────────────────────────────────────────────
// UpdateDriverPayloadDto  — used for JSON body (PATCH /drivers/:id non-formdata)
// ─────────────────────────────────────────────────────────────────────────────
export class UpdateDriverPayloadDto {
  @ApiPropertyOptional({ description: "Driver main details to update", type: () => DriverDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverDetailsDto)
  drivers_details?: DriverDetailsDto;

  @ApiPropertyOptional({ description: "Vehicle details to update", type: () => VehicleDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDetailsDto)
  drivers_vehicle_details?: VehicleDetailsDto;

  @ApiPropertyOptional({ description: "Vehicle documents to update", type: () => VehicleDocumentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  driver_vehicle_documents?: VehicleDocumentDto;

  @ApiPropertyOptional({ description: "KYC document to update", type: () => KycDocumentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => KycDocumentDto)
  driver_kyc_document?: KycDocumentDto;

  @ApiPropertyOptional({ description: "Account details to update", type: () => AccountDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccountDetailsDto)
  drvice_account_details?: AccountDetailsDto;

  @ApiPropertyOptional({ description: "Emergency contact to update", type: () => [EmergencyContactDto] })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  driver_emergency?: EmergencyContactDto[];

  @ApiPropertyOptional({ description: "Aadhar details to update", type: () => AadharDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AadharDto)
  driver_aadhar?: AadharDto;
}

// ─────────────────────────────────────────────────────────────────────────────
// updateDriverdetailsStatus  — legacy verify DTO (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────
export class updateDriverdetailsStatus {
  @ApiPropertyOptional({ description: "Driver documents details verified", type: () => DriverDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverDetailsDto)
  driver_details?: DriverDetailsDto;

  @ApiPropertyOptional({ description: "Vehicle details verified", type: () => VehicleDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDetailsDto)
  drivers_vehicle_details?: VehicleDetailsDto;

  @ApiPropertyOptional({ description: "Vehicle documents verified", type: () => VehicleDocumentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  driver_vehicle_documents?: VehicleDocumentDto;

  @ApiPropertyOptional({ description: "KYC documents verified", type: () => KycDocumentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => KycDocumentDto)
  driver_kyc_document?: KycDocumentDto;

  @ApiPropertyOptional({ description: "Account details verified", type: () => AccountDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccountDetailsDto)
  drvice_account_details?: AccountDetailsDto;

  @ApiPropertyOptional({ description: "Emergency contact to update", type: () => EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  driver_emergency?: EmergencyContactDto;

  @ApiPropertyOptional({ description: "Aadhar details to update", type: () => AadharDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AadharDto)
  driver_aadhar?: AadharDto;
}

// ─────────────────────────────────────────────────────────────────────────────
// VerifySectionDto
// ─────────────────────────────────────────────────────────────────────────────
export class VerifySectionDto {
  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ example: "active", type: String })
  @IsOptional()
  @IsString()
  status?: string;
}


// block the driver
export class BlockSectionDto {
  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  is_blocked?: boolean;
}



// ─────────────────────────────────────────────────────────────────────────────
// VerifyDriverPayloadDto
// ─────────────────────────────────────────────────────────────────────────────
export class VerifyDriverPayloadDto {
  @ApiPropertyOptional({ description: "Verify / set status on the driver's core details", type: () => VerifySectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerifySectionDto)
  drivers_details?: VerifySectionDto;

  @ApiPropertyOptional({ description: "Verify / set status on vehicle details", type: () => VerifySectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerifySectionDto)
  drivers_vehicle_details?: VerifySectionDto;

  @ApiPropertyOptional({ description: "Verify / set status on vehicle documents", type: () => VerifySectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerifySectionDto)
  driver_vehicle_documents?: VerifySectionDto;

  @ApiPropertyOptional({ description: "Verify / set status on KYC document", type: () => VerifySectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerifySectionDto)
  driver_kyc_document?: VerifySectionDto;

  @ApiPropertyOptional({ description: "Verify / set status on account details", type: () => VerifySectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerifySectionDto)
  drvice_account_details?: VerifySectionDto;

  @ApiPropertyOptional({ description: "Verify / set status on emergency contact", type: () => VerifySectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerifySectionDto)
  driver_emergency?: VerifySectionDto;

  @ApiPropertyOptional({ description: "Verify / set status on Aadhar details", type: () => VerifySectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerifySectionDto)
  driver_aadhar?: VerifySectionDto;
}


// ─────────────────────────────────────────────────────────────────────────────
// Online status of the driver

export class OnlineStatusDto {
  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  is_online?: boolean;
}
export class OnlineStatusPayloadDto {
  @ApiPropertyOptional({ description: "Set the Driver online status", type: () => OnlineStatusDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OnlineStatusDto)
  drivers_details?: OnlineStatusDto;
}


// block the driver 

export class BlockectionDto {
  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  is_blocked?: boolean;
}
export class BlockDriverPayloadDto {
  @ApiPropertyOptional({ description: "Verify / set status on the driver's core details", type: () => BlockSectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BlockectionDto)
  drivers_details?: BlockectionDto;
}

// ─────────────────────────────────────────────────────────────────────────────
// AddDriverFormDataDto  — FLAT DTO for multipart/form-data POST /drivers/add
//
// All nested-section fields are prefixed with their section name.
// File fields are handled separately by Multer (not validated here).
// ─────────────────────────────────────────────────────────────────────────────
export class AddDriverFormDataDto {
  // ── Core driver details ─────────────────────────────────────────────────
  @ApiProperty({ example: "John", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "first_name is required" })
  @IsString()
  first_name!: string;

  @ApiProperty({ example: "Doe", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "last_name is required" })
  @IsString()
  last_name!: string;

  @ApiProperty({ example: "john.doe@example.com", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "email is required" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "+1234567890", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "mobile is required" })
  @IsString()
  mobile!: string;

  @ApiPropertyOptional({ example: "+1", type: String })
  @IsOptional() @IsString()
  phone_country_code?: string;

  @ApiPropertyOptional({ example: "Male", type: String })
  @IsOptional() @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: "+10987654321", type: String })
  @IsOptional() @IsString()
  secondary_mobile?: string;

  @ApiPropertyOptional({ example: "true", type: String, description: "Pass 'true' or 'false' as string" })
  @IsOptional() @IsString()
  resident_of_karnataka?: string;

  @ApiPropertyOptional({ example: "true", type: String, description: "Pass 'true' or 'false' as string" })
  @IsOptional() @IsString()
  do_you_know_kannda?: string;

  @ApiPropertyOptional({ example: "Hindi", type: String })
  @IsOptional() @IsString()
  additional_language?: string;

  @ApiPropertyOptional({ example: "123 Main St", type: String })
  @IsOptional() @IsString()
  addressline1?: string;

  @ApiPropertyOptional({ example: "Apt 4B", type: String })
  @IsOptional() @IsString()
  addressline2?: string;

  @ApiPropertyOptional({ example: "Bengaluru", type: String })
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "Karnataka", type: String })
  @IsOptional() @IsString()
  state?: string;

  @ApiPropertyOptional({ example: "560001", type: String })
  @IsOptional() @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  created_by?: string;

  // ── Vehicle details ─────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "KA01AB1234", type: String })
  @IsOptional() @IsString()
  vehicle_number?: string;

  @ApiPropertyOptional({ example: "1", type: String, description: "Vehicle type ID (sent as string in formdata)" })
  @IsOptional() @IsString()
  vehicle_type?: string;

  @ApiPropertyOptional({ example: "2", type: String })
  @IsOptional() @IsString()
  vehicle_brand?: string;

  @ApiPropertyOptional({ example: "3", type: String })
  @IsOptional() @IsString()
  vehicle_model?: string;

  @ApiPropertyOptional({ example: "Toyota", type: String })
  @IsOptional() @IsString()
  vehicle_make?: string;

  @ApiPropertyOptional({ example: "4", type: String })
  @IsOptional() @IsString()
  vehicle_color?: string;

  @ApiPropertyOptional({ example: "true", type: String })
  @IsOptional() @IsString()
  taxi_board_installed?: string;

  // ── Vehicle documents (expiry dates / numbers) ──────────────────────────
  @ApiPropertyOptional({ example: "1HGCM82633A123456", type: String })
  @IsOptional() @IsString()
  vehicle_chessis_number?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  rc_expiry_date?: string;

  @ApiPropertyOptional({ example: "INS123456", type: String })
  @IsOptional() @IsString()
  insurance_number?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  insurance_expiry_date?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  fc_expiry_date?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  emition_puc_expiry_date?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  permit_expiry_date?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  tax_expiry_date?: string;

  // ── KYC document fields ─────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "DL1234567890", type: String })
  @IsOptional() @IsString()
  driving_licence_number?: string;

  @ApiPropertyOptional({ example: "2020-01-01", type: String })
  @IsOptional() @IsString()
  driving_licence_issued_date?: string;

  @ApiPropertyOptional({ example: "2030-01-01", type: String })
  @IsOptional() @IsString()
  driving_licence_expiry_date?: string;

  @ApiPropertyOptional({ example: "EPIC123456", type: String })
  @IsOptional() @IsString()
  epic_card_number?: string;

  @ApiPropertyOptional({ example: "ABCDE1234F", type: String })
  @IsOptional() @IsString()
  pan_card_number?: string;

  @ApiPropertyOptional({ example: "PVC123456", type: String })
  @IsOptional() @IsString()
  police_verification_file_number?: string;

  @ApiPropertyOptional({ example: "MED123456", type: String })
  @IsOptional() @IsString()
  medical_certificate_number?: string;

  @ApiPropertyOptional({ example: "BG123456", type: String })
  @IsOptional() @IsString()
  background_verification_id?: string;

  // ── Account details ──────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "123456789012", type: String })
  @IsOptional() @IsString()
  bank_account_number?: string;

  @ApiPropertyOptional({ example: "John Doe", type: String })
  @IsOptional() @IsString()
  account_holder_name?: string;

  @ApiPropertyOptional({ example: "State Bank of India", type: String })
  @IsOptional() @IsString()
  bank_name?: string;

  @ApiPropertyOptional({ example: "SBIN0001234", type: String })
  @IsOptional() @IsString()
  ifsc_code?: string;

  @ApiPropertyOptional({ example: "Connaught Place", type: String })
  @IsOptional() @IsString()
  bank_branch?: string;

  // ── Emergency contact ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "+10987654321", type: String })
  @IsOptional() @IsString()
  emergency_number?: string;

  @ApiPropertyOptional({ example: "personal", type: String })
  @IsOptional() @IsString()
  contact_type?: string;

  @ApiPropertyOptional({ example: "Jane Doe", type: String })
  @IsOptional() @IsString()
  contact_name?: string;

  @ApiPropertyOptional({ example: "Spouse", type: String })
  @IsOptional() @IsString()
  relationship?: string;

  @ApiPropertyOptional({ example: "123 Main St", type: String, description: "Emergency contact address" })
  @IsOptional() @IsString()
  emergency_address?: string;

  // ── Aadhar ────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "1234-5678-9012", type: String })
  @IsOptional() @IsString()
  aadhar_number?: string;

  @ApiPropertyOptional({ example: "123456", type: String })
  @IsOptional() @IsString()
  aadhar_otp?: string;

  // ── File upload fields (Swagger documentation only — actual files handled by Multer) ──
  @ApiPropertyOptional({ type: "string", format: "binary", description: "Driver profile image" })
  @IsOptional()
  user_image?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_rc_front_image?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_rc_back_image?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_insurance_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_fc_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_puc_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_permit_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_tax_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_driving_licence_front_image?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_driving_licence_back_image?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_epic_card_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_pan_card?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_pvc_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_medical_certificate?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_background_verification_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_front_aadhar_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_back_aadhar_document?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// UpdateDriverFormDataDto  — same shape as AddDriverFormDataDto but everything
// is optional (for PATCH /drivers/form/:id)
// ─────────────────────────────────────────────────────────────────────────────
export class UpdateDriverFormDataDto {
  // ── Core driver details ─────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "John", type: String })
  @IsOptional() @IsString()
  first_name?: string;

  @ApiPropertyOptional({ example: "Doe", type: String })
  @IsOptional() @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: "john.doe@example.com", type: String })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "+1234567890", type: String })
  @IsOptional() @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: "+1", type: String })
  @IsOptional() @IsString()
  phone_country_code?: string;

  @ApiPropertyOptional({ example: "Male", type: String })
  @IsOptional() @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: "+10987654321", type: String })
  @IsOptional() @IsString()
  secondary_mobile?: string;

  @ApiPropertyOptional({ example: "true", type: String })
  @IsOptional() @IsString()
  resident_of_karnataka?: string;

  @ApiPropertyOptional({ example: "true", type: String })
  @IsOptional() @IsString()
  do_you_know_kannda?: string;

  @ApiPropertyOptional({ example: "Hindi", type: String })
  @IsOptional() @IsString()
  additional_language?: string;

  @ApiPropertyOptional({ example: "123 Main St", type: String })
  @IsOptional() @IsString()
  addressline1?: string;

  @ApiPropertyOptional({ example: "Apt 4B", type: String })
  @IsOptional() @IsString()
  addressline2?: string;

  @ApiPropertyOptional({ example: "Bengaluru", type: String })
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "Karnataka", type: String })
  @IsOptional() @IsString()
  state?: string;

  @ApiPropertyOptional({ example: "560001", type: String })
  @IsOptional() @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: "uuid-of-admin", type: String })
  @IsOptional() @IsString()
  updated_by?: string;

  // ── Vehicle details ─────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "KA01AB1234", type: String })
  @IsOptional() @IsString()
  vehicle_number?: string;

  @ApiPropertyOptional({ example: "1", type: String })
  @IsOptional() @IsString()
  vehicle_type?: string;

  @ApiPropertyOptional({ example: "2", type: String })
  @IsOptional() @IsString()
  vehicle_brand?: string;

  @ApiPropertyOptional({ example: "3", type: String })
  @IsOptional() @IsString()
  vehicle_model?: string;

  @ApiPropertyOptional({ example: "Toyota", type: String })
  @IsOptional() @IsString()
  vehicle_make?: string;

  @ApiPropertyOptional({ example: "4", type: String })
  @IsOptional() @IsString()
  vehicle_color?: string;

  @ApiPropertyOptional({ example: "true", type: String })
  @IsOptional() @IsString()
  taxi_board_installed?: string;

  // ── Vehicle documents ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "1HGCM82633A123456", type: String })
  @IsOptional() @IsString()
  vehicle_chessis_number?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  rc_expiry_date?: string;

  @ApiPropertyOptional({ example: "INS123456", type: String })
  @IsOptional() @IsString()
  insurance_number?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  insurance_expiry_date?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  fc_expiry_date?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  emition_puc_expiry_date?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  permit_expiry_date?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  @IsOptional() @IsString()
  tax_expiry_date?: string;

  // ── KYC ─────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "DL1234567890", type: String })
  @IsOptional() @IsString()
  driving_licence_number?: string;

  @ApiPropertyOptional({ example: "2020-01-01", type: String })
  @IsOptional() @IsString()
  driving_licence_issued_date?: string;

  @ApiPropertyOptional({ example: "2030-01-01", type: String })
  @IsOptional() @IsString()
  driving_licence_expiry_date?: string;

  @ApiPropertyOptional({ example: "EPIC123456", type: String })
  @IsOptional() @IsString()
  epic_card_number?: string;

  @ApiPropertyOptional({ example: "ABCDE1234F", type: String })
  @IsOptional() @IsString()
  pan_card_number?: string;

  @ApiPropertyOptional({ example: "PVC123456", type: String })
  @IsOptional() @IsString()
  police_verification_file_number?: string;

  @ApiPropertyOptional({ example: "MED123456", type: String })
  @IsOptional() @IsString()
  medical_certificate_number?: string;

  @ApiPropertyOptional({ example: "BG123456", type: String })
  @IsOptional() @IsString()
  background_verification_id?: string;

  // ── Account details ──────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "123456789012", type: String })
  @IsOptional() @IsString()
  bank_account_number?: string;

  @ApiPropertyOptional({ example: "John Doe", type: String })
  @IsOptional() @IsString()
  account_holder_name?: string;

  @ApiPropertyOptional({ example: "State Bank of India", type: String })
  @IsOptional() @IsString()
  bank_name?: string;

  @ApiPropertyOptional({ example: "SBIN0001234", type: String })
  @IsOptional() @IsString()
  ifsc_code?: string;

  @ApiPropertyOptional({ example: "Connaught Place", type: String })
  @IsOptional() @IsString()
  bank_branch?: string;

  // ── Emergency contact ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "+10987654321", type: String })
  @IsOptional() @IsString()
  emergency_number?: string;

  @ApiPropertyOptional({ example: "personal", type: String })
  @IsOptional() @IsString()
  contact_type?: string;

  @ApiPropertyOptional({ example: "Jane Doe", type: String })
  @IsOptional() @IsString()
  contact_name?: string;

  @ApiPropertyOptional({ example: "Spouse", type: String })
  @IsOptional() @IsString()
  relationship?: string;

  @ApiPropertyOptional({ example: "123 Main St", type: String })
  @IsOptional() @IsString()
  emergency_address?: string;

  // ── Aadhar ────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: "1234-5678-9012", type: String })
  @IsOptional() @IsString()
  aadhar_number?: string;

  @ApiPropertyOptional({ example: "123456", type: String })
  @IsOptional() @IsString()
  aadhar_otp?: string;

  // ── File upload fields ──────────────────────────────────────────────────
  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  user_image?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_rc_front_image?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_rc_back_image?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_insurance_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_fc_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_puc_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_permit_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_tax_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_driving_licence_front_image?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_driving_licence_back_image?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_epic_card_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_pan_card?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_pvc_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_medical_certificate?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_background_verification_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_front_aadhar_document?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  @IsOptional()
  upload_back_aadhar_document?: any;
}


// resend Otp
export class ResendOtpDto {
  @ApiProperty({ example: "+1234567890", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "mobile is required" })
  @IsString()
  mobile!: string;
}


export class updateB2CDto {
  @ApiProperty({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  b2c!: boolean;
}


// Admin once verified the documents then he should change the status of the driver

export class DriverAadharVerifyDto {
  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  aadhar_status?: string;

  @ApiPropertyOptional({ example: "Aadhar verified successfully" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DriverKycVerifyDto {
  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  driving_licence_status?: string;

  @ApiPropertyOptional({ example: "Driving licence verified" })
  @IsOptional()
  @IsString()
  driving_licence_notes?: string;

  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  epic_card_status?: string;

  @ApiPropertyOptional({ example: "EPIC verified" })
  @IsOptional()
  @IsString()
  epic_card_notes?: string;

  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  pancard_status?: string;

  @ApiPropertyOptional({ example: "PAN verified" })
  @IsOptional()
  @IsString()
  pancard_notes?: string;

  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  pvc_status?: string;

  @ApiPropertyOptional({ example: "PVC verified" })
  @IsOptional()
  @IsString()
  pvc_notes?: string;

  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  medical_certificate_status?: string;

  @ApiPropertyOptional({ example: "Medical verified" })
  @IsOptional()
  @IsString()
  medical_certificate_notes?: string;

  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  background_verification_status?: string;

  @ApiPropertyOptional({ example: "Background verified" })
  @IsOptional()
  @IsString()
  background_verification_notes?: string;

  @ApiPropertyOptional({ example: "Test", type: String })
  @IsOptional()
  @IsString()
  court_verification_notes?: string;

  @ApiPropertyOptional({ example: "verified", type: String })
  @IsOptional()
  @IsString()
  court_verification_status?: string;
}



export class DriverVehicleDocumentsVerifyDto {
  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  rc_status?: string;

  @ApiPropertyOptional({ example: "RC verified" })
  @IsOptional()
  @IsString()
  rc_notes?: string;

  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  fitness_certificate_status?: string;

  @ApiPropertyOptional({ example: "FC verified" })
  @IsOptional()
  @IsString()
  fitness_certificate_notes?: string;

  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  insurance_status?: string;

  @ApiPropertyOptional({ example: "Insurance verified" })
  @IsOptional()
  @IsString()
  insurance_notes?: string;

  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  emission_puc_status?: string;

  @ApiPropertyOptional({ example: "PUC verified" })
  @IsOptional()
  @IsString()
  emission_puc_notes?: string;

  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  permit_status?: string;

  @ApiPropertyOptional({ example: "Permit verified" })
  @IsOptional()
  @IsString()
  permit_notes?: string;

  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  tax_status?: string;

  @ApiPropertyOptional({ example: "Tax verified" })
  @IsOptional()
  @IsString()
  tax_notes?: string;
}

export class DriverProfileVerifyDto {
  @ApiPropertyOptional({ example: "verified" })
  @IsOptional()
  @IsString()
  profile_status?: string;

  @ApiPropertyOptional({ example: "Profile details look good" })
  @IsOptional()
  @IsString()
  profile_notes?: string;
}

export class UpdateDriverVerifyStatusDto {
  @ApiPropertyOptional({ type: DriverProfileVerifyDto })
  @Allow()
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverProfileVerifyDto)
  driver_profile?: DriverProfileVerifyDto;

  @ApiPropertyOptional({ type: DriverAadharVerifyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverAadharVerifyDto)
  driver_aadhar?: DriverAadharVerifyDto;

  @ApiPropertyOptional({ type: DriverKycVerifyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverKycVerifyDto)
  driver_kyc?: DriverKycVerifyDto;

  @ApiPropertyOptional({ type: DriverVehicleDocumentsVerifyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverVehicleDocumentsVerifyDto)
  driver_vehicle_documents?: DriverVehicleDocumentsVerifyDto;

  @ApiPropertyOptional({
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_onboard?: boolean;
}


export class SendOTPDtoForDriver {
  @ApiProperty({ example: "+1234567890", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "mobile is required" })
  @IsString()
  mobile!: string;

  @ApiProperty({ example: "+91", type: String })
  @IsNotEmpty({ message: "phoneCountryCode is required" })
  @IsString()
  phoneCountryCode!: string;
}


export class VerifyOtpDtoForDriver {
  @ApiProperty({ example: "1234567890", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "mobile is required" })
  @IsString()
  mobile!: string;

  @ApiProperty({ example: "672633", type: String })
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsNotEmpty({ message: "otp is required" })
  @IsString()
  otp!: string;
}




// export enum DriverStatus {
//   ACTIVE = 'active',
//   INACTIVE = 'inactive',
//   SUSPENDED = 'suspended',
// }


// export class ImportDriverDto {
//   mobile?: string;
//   firstName?: string;
//   lastName?: string;
//   email?: string;
//   gender?: string;
//   secondaryMobile?: string;
//   residentOfKarnataka?: boolean;
//   doYouKnowKannada?: boolean;
//   additionalLanguage?: string;
//   addressline1?: string;
//   addressline2?: string;
//   city?: string;
//   state?: string;
//   pincode?: string;
//   fleet_owner_id?: string;
//   is_fleet_added?: boolean;
//   status?: DriverStatus;
// }