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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PostStatus } from '@prisma/client';

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
