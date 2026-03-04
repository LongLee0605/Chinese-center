import { IsString, IsOptional, MinLength, IsArray, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassDto {
  @IsString()
  @MinLength(1, { message: 'Tên lớp không được để trống' })
  name!: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  /** 0=CN, 1=T2, ..., 6=T7 */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @Type(() => Number)
  scheduleDayOfWeek?: number[];

  @IsOptional()
  @IsString()
  scheduleStartTime?: string;

  @IsOptional()
  @IsString()
  scheduleEndTime?: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxMembers?: number;
}
