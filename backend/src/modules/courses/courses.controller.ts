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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as multer from 'multer';
import { CoursesService } from './courses.service';
import { RolesGuard } from '../../core/guards/roles.guard';
import { OptionalJwtAuthGuard } from '../../core/guards/optional-jwt.guard';

const coursesUploadDir = 'uploads/courses';

function ensureDir() {
  if (!existsSync(coursesUploadDir)) mkdirSync(coursesUploadDir, { recursive: true });
}

@Controller('courses')
export class CoursesController {
  constructor(private courses: CoursesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.courses.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
  }

  /** Website: danh sách khóa học theo quyền (guest hoặc role). */
  @Get('public')
  @UseGuards(OptionalJwtAuthGuard)
  getPublicList(
    @Request() req: { user?: { role?: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const role = req.user?.role ?? null;
    return this.courses.findForPublic(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      role,
    );
  }

  @Get('by-slug/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  getBySlug(
    @Request() req: { user?: { sub?: string; role?: string } },
    @Param('slug') slug: string,
  ) {
    const userId = req.user?.sub ?? null;
    const role = req.user?.role ?? null;
    return this.courses.findBySlug(slug, role, userId);
  }

  /** CRM: danh sách học viên đã đăng ký khóa học */
  @Get(':courseId/enrollments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getEnrollments(
    @Request() req: { user: { role: string } },
    @Param('courseId') courseId: string,
  ) {
    return this.courses.getEnrollments(courseId, req.user.role);
  }

  /** CRM: đăng ký học viên vào khóa học */
  @Post(':courseId/enrollments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  addEnrollment(
    @Request() req: { user: { role: string } },
    @Param('courseId') courseId: string,
    @Body() body: { userId: string },
  ) {
    if (!body?.userId) throw new BadRequestException('Thiếu userId.');
    return this.courses.addEnrollment(courseId, body.userId, req.user.role);
  }

  /** CRM: hủy đăng ký */
  @Delete(':courseId/enrollments/:enrollmentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  removeEnrollment(
    @Request() req: { user: { role: string } },
    @Param('courseId') courseId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.courses.removeEnrollment(courseId, enrollmentId, req.user.role);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getOne(
    @Request() req: { user?: { role?: string } },
    @Param('id') id: string,
  ) {
    const role = req.user?.role ?? null;
    return this.courses.findOne(id, role);
  }

  @Post('upload-image')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          ensureDir();
          cb(null, coursesUploadDir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '') || '.jpg';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        cb(null, /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype));
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file?.filename) throw new BadRequestException('Chưa chọn file ảnh hợp lệ');
    return { path: `courses/${file.filename}` };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() body: any) {
    return this.courses.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(
    @Request() req: { user: { role: string } },
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.courses.update(id, body, req.user.role);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Request() req: { user: { role: string } }, @Param('id') id: string) {
    return this.courses.remove(id, req.user.role);
  }
}
