import { IsString, IsEnum, IsOptional } from 'class-validator';
import { LeadType } from '@prisma/client';

export class CreateLeadDto {
  @IsEnum(LeadType)
  type: LeadType;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  courseInterest?: string;

  @IsOptional()
  @IsString()
  timePreference?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
