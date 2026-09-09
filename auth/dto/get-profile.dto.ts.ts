import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'Sunil' })
  firstName!: string;

  @ApiPropertyOptional({ example: 'Kumar S' })
  lastName!: string | null;

  @ApiProperty({ example: 'sunilkumar@silicondrive.com' })
  email!: string;

  @ApiPropertyOptional({ example: '+91' })
  phoneCountryCode!: string | null;

  @ApiPropertyOptional({ example: '9876543210' })
  phoneNumber!: string | null;

  @ApiPropertyOptional({ example: 1, description: '1=Male, 2=Female, 3=Other' })
  gender!: number | null;

  @ApiPropertyOptional({ example: 'uuid-of-role' })
  role_id!: string | null;

  @ApiPropertyOptional({ example: 'Administrator' })
  role!: string | null;

  @ApiProperty({ example: '2026-01-01' })
  dateOfJoined!: Date | null;

  @ApiPropertyOptional({ example: '11, 4th cross street, Ranka Colony,' })
  addressLine1!: string | null;

  @ApiPropertyOptional({ example: 'Bannerghatta Road' })
  addressLine2!: string | null;

  @ApiPropertyOptional({ example: '12' })
  city_id!: string | null;

  @ApiPropertyOptional({ example: 'Whitefield' })
  city!: string | null;

  @ApiPropertyOptional({ example: 'uuid-of-state' })
  state_id!: string | null;

  @ApiPropertyOptional({ example: 'Karnataka' })
  state!: string | null;

  @ApiPropertyOptional({ example: '560066' })
  pinCode!: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/image.jpg' })
  image!: string | null;

  @ApiProperty({ example: 2, description: '1=SuperAdmin, 2=Admin, 3=Staff' })
  userType!: number;

  @ApiProperty({ example: 1, description: '1=Active, 2=Inactive, 3=Suspended' })
  status!: number;

  @ApiProperty()
  createdAt!: Date;
}