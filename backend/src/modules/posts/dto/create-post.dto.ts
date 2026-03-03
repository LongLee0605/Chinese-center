import { IsString, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  publishedAt?: string; // ISO date

  /** Cho phép khách (chưa đăng nhập) xem bài viết này. */
  @IsOptional()
  @IsBoolean()
  allowGuest?: boolean;

  /** Vai trò được xem. Rỗng = tất cả. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleToRoles?: string[];
}
