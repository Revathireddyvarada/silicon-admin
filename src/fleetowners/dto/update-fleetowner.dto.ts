import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateFleetownerFormDto {
  @ApiPropertyOptional({ example: "ABC Company" })
  companyName?: string;

  @ApiPropertyOptional({ example: "John Doe" })
  name?: string;

  @ApiPropertyOptional({ example: "9876543210" })
  mobileNumber?: string;

  @ApiPropertyOptional({ example: "contact@abc.com" })
  email?: string;

  @ApiPropertyOptional({
    description: "Comma-separated doc types to delete",
    example: "CANCELLED_CHEQUE,GST_CERTIFICATE",
  })
  deleteDocs?: string;

  @ApiPropertyOptional({
    example: "true",
    description: "Set to true to delete logo",
  })
  deleteLogo?: string;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  logo?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  cancelledCheque?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  pancardDocument?: any;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  gstCertificate?: any;
}
