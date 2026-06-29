import { IsOptional, MaxLength } from 'class-validator';

// No dedicated DTO needed for upload — the file comes as multipart/form-data.
// These DTOs are placeholders for future use (e.g., batch rename).

export class UpdateDocumentDto {
  @IsOptional()
  @MaxLength(500)
  originalName?: string;
}