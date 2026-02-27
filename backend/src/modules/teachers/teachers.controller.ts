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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles.guard';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { basename } from 'path';

const teachersUploadDir = 'uploads/teachers';

@Controller('teachers')
export class TeachersController {
  constructor(private teachers: TeachersService) {}

  /** Public: website lấy danh sách giáo viên hiển thị */
  @Get()
  getPublicList() {
    return this.teachers.findPublicList();
  }

  /** CRM: danh sách có phân trang */
  @Get('crm/list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  crmList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.teachers.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getOne(@Param('id') id: string) {
    return this.teachers.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() dto: CreateTeacherDto) {
    return this.teachers.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachers.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string) {
    return this.teachers.remove(id);
  }

  @Post(':id/avatar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      dest: teachersUploadDir,
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: { path?: string; originalname?: string },
  ) {
    if (!file || !file.path) throw new BadRequestException('Chưa chọn file ảnh');
    const filename = basename(file.path);
    const avatarPath = `teachers/${filename}`;
    await this.teachers.update(id, { avatarPath });
    return { avatarPath };
  }
}
