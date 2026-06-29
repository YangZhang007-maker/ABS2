import {
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
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

  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  password?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  password?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;
}