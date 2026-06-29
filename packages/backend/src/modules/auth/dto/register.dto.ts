import { IsString, IsOptional, MaxLength, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MaxLength(50)
  username: string;

  @IsString()
  @MaxLength(200)
  password: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;
}