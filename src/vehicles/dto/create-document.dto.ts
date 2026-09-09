import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateVehicleDocumentsDto {
  @ApiProperty({ example: "1HGCM82633A123456", type: String })
  vehicle_chessis_number!: string;

  @ApiProperty({ example: "2025-12-31", type: String })
  rc_expiry_date!: string;

  @ApiProperty({ example: "url_or_path", type: String })
  upload_rc_front_image!: string;

  @ApiProperty({ example: "url_or_path", type: String })
  upload_rc_back_image!: string;

  @ApiProperty({ example: "2025-12-31", type: String })
  fc_expiry_date!: string;

  @ApiProperty({ example: "url_or_path", type: String })
  upload_fc_document!: string;

  @ApiProperty({ example: "INS123456", type: String })
  insurance_number!: string;

  @ApiProperty({ example: "2025-12-31", type: String })
  insurance_expiry_date!: string;

  @ApiProperty({ example: "url_or_path", type: String })
  upload_insurance_document!: string;

  @ApiProperty({ example: "2025-12-31", type: String })
  emition_puc_expiry_date!: string;

  @ApiProperty({ example: "url_or_path", type: String })
  upload_puc_document!: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  permit_expiry_date?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  upload_permit_document?: string;

  @ApiPropertyOptional({ example: "2025-12-31", type: String })
  tax_expiry_date?: string;

  @ApiPropertyOptional({ example: "url_or_path", type: String })
  upload_tax_document?: string;
}
