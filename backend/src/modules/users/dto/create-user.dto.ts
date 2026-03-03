import { IsString, IsEmail, IsEnum, IsOptional, MinLength, IsArray, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /** Chỉ dùng khi role = TEACHER */
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
