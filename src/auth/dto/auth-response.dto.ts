import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT Access Token', type: String })
  access_token!: string;

  @ApiProperty({ description: 'Expires in seconds', type: Number })
  expires_in!: number;

  @ApiProperty({ description: 'ISO date string when access token expires', type: String })
  expiry_date!: string;

  @ApiProperty({ description: 'Refresh token to obtain new access tokens', type: String })
  refresh_token!: string;

  @ApiProperty({ description: 'ISO date string when refresh token expires', type: String })
  refresh_expires_at!: string;
}
