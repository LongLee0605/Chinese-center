import { IsString, IsEmail, IsEnum, IsOptional, MinLength, ValidateIf, IsArray, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.password != null && o.password !== '')
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  yearsExperience?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  teacherPublic?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  teacherOrderIndex?: number;
}
