import { ApiPropertyOptional } from "@nestjs/swagger";

export class VerifyFleetownerDto {
  @ApiPropertyOptional({ example: true })
  isApproved?: boolean;

  @ApiPropertyOptional({ example: true })
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ example: true })
  isCancelledChequeVerified?: boolean;

  @ApiPropertyOptional({ example: true })
  isPancardVerified?: boolean;

  @ApiPropertyOptional({ example: true })
  isGstVerified?: boolean;
}
