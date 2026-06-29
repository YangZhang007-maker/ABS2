import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { DateMode, RefType } from '../../../common/enums/date-mode.enum';

export class CreateReminderEventDto {
  @IsString()
  @MaxLength(200)
  reminderName: string;

  @IsEnum(DateMode)
  dateMode: DateMode;

  @ValidateIf((o) => o.dateMode === DateMode.RELATIVE)
  @IsEnum(RefType)
  refType?: RefType;

  @ValidateIf((o) => o.dateMode === DateMode.RELATIVE)
  @IsInt()
  @Min(0)
  offsetDays?: number;

  @ValidateIf((o) => o.dateMode === DateMode.MANUAL)
  @IsDateString()
  manualDate?: string;
}

export class UpdateReminderEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reminderName?: string;

  @IsOptional()
  @IsEnum(DateMode)
  dateMode?: DateMode;

  @ValidateIf((o) => o.dateMode === DateMode.RELATIVE)
  @IsOptional()
  @IsEnum(RefType)
  refType?: RefType;

  @ValidateIf((o) => o.dateMode === DateMode.RELATIVE)
  @IsOptional()
  @IsInt()
  @Min(0)
  offsetDays?: number;

  @ValidateIf((o) => o.dateMode === DateMode.MANUAL)
  @IsOptional()
  @IsDateString()
  manualDate?: string;
}