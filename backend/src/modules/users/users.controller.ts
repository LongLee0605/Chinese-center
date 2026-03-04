import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as multer from 'multer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

const usersAvatarDir = 'uploads/teachers';
function ensureAvatarDir() {
  if (!existsSync(usersAvatarDir)) mkdirSync(usersAvatarDir, { recursive: true });
}

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  /** Website/CRM: xem chi tiết tài khoản của chính mình (mọi role đã đăng nhập). */
  @Get('me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  getMe(@Request() req: { user: { sub: string; role: string } }) {
    return this.users.findOneWithDetail(req.user.sub, req.user.sub, req.user.role as UserRole);
  }

  /** Super Admin: tất cả. Giảng viên: bản thân + học viên. accountType: all | official | trial */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TEACHER)
  list(
    @Request() req: { user: { sub: string; role: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: UserRole,
    @Query('accountType') accountType?: 'all' | 'official' | 'trial',
  ) {
    return this.users.findAll(
      {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        role,
        accountType: accountType ?? 'all',
      },
      req.user.sub,
      req.user.role as UserRole,
    );
  }

  /** Super Admin: bất kỳ. Giảng viên: bản thân hoặc học viên. Trả về chi tiết + với học viên: enrollments, progress %, quiz attempts. */
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TEACHER)
  getOne(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.users.findOneWithDetail(id, req.user.sub, req.user.role as UserRole);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Post(':id/avatar')
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          ensureAvatarDir();
          cb(null, usersAvatarDir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '') || '.jpg';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        cb(null, /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype));
      },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.filename) throw new BadRequestException('Chưa chọn file ảnh hợp lệ');
    const avatarPath = `teachers/${file.filename}`;
    await this.users.updateAvatar(id, avatarPath);
    return { avatarPath };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
