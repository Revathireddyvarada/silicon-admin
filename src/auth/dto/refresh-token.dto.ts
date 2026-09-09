import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsString()
  access_token?: string;
}