import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEmail, IsInt, IsDateString, Min, Max, IsUUID,
} from 'class-validator';

export class UpdateProfileDto {

 @ApiPropertyOptional({ example: 'Sunil' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'Sunil' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Kumar S' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+91' })
  @IsOptional()
  @IsString()
  phoneCountryCode?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'sunilkumar@silicondrive.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 1, description: '1=Male, 2=Female, 3=Other' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  gender?: number;

  @ApiPropertyOptional({ example: '2026-01-24' })
  @IsOptional()
  @IsDateString()
  dateOfJoined?: string;

  @ApiPropertyOptional({ example: '11, 4th cross street, Ranka Colony,' })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Bannerghatta Road' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'uuid-of-role', description: 'Role UUID' })
  @IsOptional()
  @IsUUID()          // <-- rejects anything that isn't a valid UUID
  roleId?: string;


  @ApiPropertyOptional({ example: 'uuid-of-city', description: 'City UUID' })
  @IsOptional()
  @IsUUID()          // <-- rejects anything that isn't a valid UUID
  cityId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-state', description: 'State UUID' })
  @IsOptional()
  @IsUUID()
  stateId?: string;

  @ApiPropertyOptional({ example: '560066' })
  @IsOptional()
  @IsString()
  pinCode?: string;
}