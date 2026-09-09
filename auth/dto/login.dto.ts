import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'john@silicondrive.com',
    required: true,
    type: String,
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsString({ message: 'email must be a string' })
  @IsNotEmpty({ message: 'email is required' })
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value?.toLowerCase().trim()
  )
  email!: string;

  @ApiProperty({
    description: 'Password',
    example: 'SecurePassword123!',
    minLength: 6,
    required: true,
    type: String,
  })
  @MinLength(6, { message: 'password must be at least 6 characters' })
  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value
  )
  password!: string;
}