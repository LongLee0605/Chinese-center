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
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PostStatus } from '@prisma/client';
import * as multer from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const postsUploadDir = 'uploads/posts';

function ensureDir() {
  if (!existsSync(postsUploadDir)) mkdirSync(postsUploadDir, { recursive: true });
}

@Controller('posts')
export class PostsController {
  constructor(private posts: PostsService) {}

  // ----- Public (website): chỉ bài đã xuất bản -----
  @Get()
  getList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.posts.findPublicList(Number(page) || 1, Number(limit) || 10);
  }

  // ----- CRM: danh sách có lọc status -----
  @Get('crm/list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  crmList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PostStatus,
  ) {
    return this.posts.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
  }

  @Get('by-slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.posts.findBySlug(slug);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.posts.findOne(id);
  }

  // ----- CRM (Admin/Teacher) -----
  @Post('upload-image')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          ensureDir();
          cb(null, postsUploadDir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '') || '.jpg';
          const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
        cb(null, !!ok);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.filename) throw new BadRequestException('Chưa chọn file ảnh hợp lệ');
    return { path: `posts/${file.filename}` };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Request() req: { user: { sub: string } }, @Body() dto: CreatePostDto) {
    return this.posts.create(req.user.sub, dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.posts.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string) {
    return this.posts.remove(id);
  }
}
