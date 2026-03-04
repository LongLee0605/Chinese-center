import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';

/** Body cho POST /schedule/:classId/register-request (khách gửi form đăng ký lớp). */
export class RegisterRequestDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Họ tên không được để trống' })
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  className?: string;

  /** ISO date string (ngày buổi học) */
  @IsOptional()
  @IsString()
  classDate?: string;
}
