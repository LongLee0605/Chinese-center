import { IsString, IsOptional, IsInt, IsEnum, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsString()
  questionText!: string;

  @IsOptional()
  @IsArray()
  options?: string[]; // for MULTIPLE_CHOICE: ["A", "B", "C", "D"]

  @IsString()
  correctAnswer!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
