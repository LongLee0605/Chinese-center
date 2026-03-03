import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { QuizType } from '@prisma/client';

export class CreateQuizDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(QuizType)
  quizType?: QuizType;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeLimitMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  passingScore?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  allowGuest?: boolean;

  /** Vai trò được xem/làm bài. Rỗng = tất cả. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleToRoles?: string[];
}
