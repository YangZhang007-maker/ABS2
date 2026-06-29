import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateScheduleEventDto {
  @IsString()
  @MaxLength(100)
  eventType: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;

  @IsDateString()
  eventDate: string;
}

export class UpdateScheduleEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  eventType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;
}