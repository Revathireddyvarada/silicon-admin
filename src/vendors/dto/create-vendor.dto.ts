import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateVendorDto {
  @ApiPropertyOptional({
    type: "string",
    format: "binary",
    description: "Logo",
  })
  logo?: string;

  @ApiProperty({ type: String, example: "ABC Vendor Company" })
  companyName!: string;

  @ApiProperty({ type: String, example: "John Doe" })
  name!: string;

  @ApiProperty({ type: String, example: "+91" })
  mobileCountryCode!: string;

  @ApiProperty({ type: String, example: "9876543210" })
  mobileNumber!: string;

  @ApiProperty({ type: String, example: "contact@abcvendor.com" })
  email!: string;

  @ApiProperty({ type: String, example: "123 Main Street" })
  addressLine1!: string;

  @ApiPropertyOptional({ type: String })
  addressLine2?: string;

  @ApiProperty({ type: String, example: "Mumbai" })
  city!: string;

  @ApiProperty({ type: String, example: "MH" })
  stateId!: string;

  @ApiProperty({ type: String, example: "400001" })
  pincode!: string;

  @ApiPropertyOptional({ type: String, example: "John Doe" })
  accountHolderName?: string;

  @ApiPropertyOptional({ type: String, example: "1234567890" })
  accountNumber?: string;

  @ApiPropertyOptional({ type: String, example: "State Bank of India" })
  bankName?: string;

  @ApiPropertyOptional({ type: String, example: "SBIN0001234" })
  ifscCode?: string;

  @ApiPropertyOptional({ type: String })
  branch?: string;

  @ApiProperty({ type: String, example: "ABCDE1234F" })
  pancardNumber!: string;

  @ApiProperty({ type: String, example: "27AABCT1234H1Z0" })
  gstNumber?: string;

  // ─── File fields — Swagger UI only ───────────────────────────────────────
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Cancelled cheque document (PDF/image) — required",
  })
  cancelledCheque?: any;

  @ApiProperty({
    type: "string",
    format: "binary",
    description: "PAN card document (PDF/image) — required",
  })
  pancardDocument?: any;

  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Cancelled cheque document (PDF/image) — required",
  })
  gstCertificate?: any;

  @ApiProperty({
    type: String,
    enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
    example: "ACTIVE",
  })
  status?: string;
}
