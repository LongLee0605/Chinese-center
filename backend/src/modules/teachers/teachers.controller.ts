import { Controller, Get } from '@nestjs/common';
import { TeachersService } from './teachers.service';

/** Chỉ endpoint public cho website. Quản lý giảng viên thực hiện qua Tài khoản (User role TEACHER). */
@Controller('teachers')
export class TeachersController {
  constructor(private teachers: TeachersService) {}

  @Get()
  getPublicList() {
    return this.teachers.findPublicList();
  }
}
