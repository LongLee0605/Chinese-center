import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EnrollmentRequestsService } from './enrollment-requests.service';
import { RolesGuard } from '../../core/guards/roles.guard';

@Controller('enrollment-requests')
export class EnrollmentRequestsController {
  constructor(private service: EnrollmentRequestsService) {}

  /** Website (đã đăng nhập): gửi yêu cầu đăng ký khóa */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Request() req: { user: { sub: string } }, @Body() body: { courseId: string }) {
    if (!body?.courseId) throw new BadRequestException('Thiếu courseId');
    return this.service.create(body.courseId, req.user.sub);
  }

  /** CRM: danh sách yêu cầu (có thể lọc theo courseId, status) */
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  list(
    @Request() req: { user: { role: string } },
    @Query('courseId') courseId?: string,
    @Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      {
        courseId: courseId || undefined,
        status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
      req.user.role as 'SUPER_ADMIN' | 'TEACHER',
    );
  }

  /** CRM: duyệt (approve/reject) */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  review(
    @Request() req: { user: { sub: string; role: string } },
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; note?: string },
  ) {
    if (!body?.status || !['APPROVED', 'REJECTED'].includes(body.status)) {
      throw new BadRequestException('status phải là APPROVED hoặc REJECTED');
    }
    return this.service.review(id, { status: body.status, note: body.note }, req.user.sub, req.user.role as 'SUPER_ADMIN' | 'TEACHER');
  }
}
