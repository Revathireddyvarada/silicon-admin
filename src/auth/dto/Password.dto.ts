import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ChangePasswordDto {
  @IsNotEmpty()
  currentPassword!: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;

  @IsNotEmpty()
  confirmPassword!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'xyz@silicondrive.com',
    required: true,
    type: String,
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsString({ message: 'email must be a string' })
  @IsNotEmpty({ message: 'email is required' })
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value?.toLowerCase().trim()
  )
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'NewPass@123',
    required: true,
    type: String,
  })
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword!: string;

  @ApiProperty({
    example: 'NewPass@123',
    required: true,
    type: String,
  })
  @IsString({ message: 'Confirm password must be a string' })
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword!: string;
}