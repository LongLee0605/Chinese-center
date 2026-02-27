import { IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitAttemptDto {
  @IsObject()
  answers!: Record<string, string>; // questionId -> answer (text or option key)

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;
}
