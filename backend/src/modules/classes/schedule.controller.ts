import { Controller, Get, Post, Body, Param, UseGuards, Request, Header } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ClassesService } from './classes.service';
import { RegisterRequestDto } from './dto/register-request.dto';

/** API công khai cho website: lịch lớp, đăng ký (có TK + khách). */
@Controller('schedule')
export class ScheduleController {
  constructor(private service: ClassesService) {}

  /** GET /schedule – không cần auth. Trả về danh sách lớp OPEN có lịch. */
  @Get()
  @Header('Cache-Control', 'no-store')
  getPublicSchedule() {
    return this.service.getPublicSchedule();
  }

  /** POST /schedule/:classId/join – học viên đã đăng nhập tự đăng ký vào lớp. */
  @Post(':classId/join')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDENT)
  joinClass(
    @Request() req: { user: { sub: string } },
    @Param('classId') classId: string,
  ) {
    return this.service.joinClass(classId, req.user.sub);
  }

  /** POST /schedule/:classId/register-request – khách gửi form (email, tên, SĐT, tên khóa, ngày học). */
  @Post(':classId/register-request')
  registerRequest(@Param('classId') classId: string, @Body() body: RegisterRequestDto) {
    return this.service.registerRequest(classId, body);
  }
}
