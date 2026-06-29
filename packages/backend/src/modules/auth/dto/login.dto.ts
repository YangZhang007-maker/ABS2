import { IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MaxLength(50)
  username: string;

  @IsString()
  @MaxLength(200)
  password: string;
}