import { ApiPropertyOptional } from "@nestjs/swagger";

export class GetTripsQueryDto {
  @ApiPropertyOptional()
  page?: number;

  @ApiPropertyOptional()
  limit?: number;

  @ApiPropertyOptional()
  vendorId?: string;

  @ApiPropertyOptional()
  driverId?: string;

  @ApiPropertyOptional()
  fleetId?: string;

  @ApiPropertyOptional()
  pickupLocation?: string;

  @ApiPropertyOptional()
  dropLocation?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  toDate?: string;

  @ApiPropertyOptional()
  is_security?: boolean;
}