import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindEmailDto {
  @ApiProperty({
    example    : 'john@silicondrive.com',
    required   : true,
    type       : String,
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsString({ message: 'email must be a string' })
  @IsNotEmpty({ message: 'email is required' })
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value?.toLowerCase().trim()
  )
  email!: string;
}