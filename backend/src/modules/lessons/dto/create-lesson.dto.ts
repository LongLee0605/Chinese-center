import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LessonType } from '@prisma/client';

export class CreateLessonDto {
  @IsString()
  courseId: string;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;
}
