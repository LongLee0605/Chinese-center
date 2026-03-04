import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TrialRegistrationsService } from './trial-registrations.service';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';

@Controller('trial-registrations')
export class TrialRegistrationsController {
  constructor(private service: TrialRegistrationsService) {}

  /** Website (công khai): đăng ký học thử */
  @Post()
  create(@Body() body: { email: string; fullName: string; phone?: string; courseSlug: string; message?: string }) {
    if (!body?.email || !body?.fullName || !body?.courseSlug) {
      throw new BadRequestException('Email, họ tên và khóa học (courseSlug) là bắt buộc.');
    }
    return this.service.create({
      email: body.email,
      fullName: body.fullName,
      phone: body.phone,
      courseSlug: body.courseSlug,
      message: body.message,
    });
  }

  /** CRM: danh sách đăng ký học thử */
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

  /** CRM: làm sạch liên kết đăng ký – user đã xóa hoặc không còn trial → set createdUserId = null */
  @Post('cleanup')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  cleanup(@Request() req: { user: { role: string } }) {
    return this.service.cleanupOrphanedTrialLinks(req.user.role as 'SUPER_ADMIN' | 'TEACHER');
  }

  /** CRM: xóa toàn bộ đăng ký học thử – chỉ SUPER_ADMIN */
  @Delete('all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  deleteAll(@Request() req: { user: { role: string } }) {
    return this.service.deleteAll(req.user.role as 'SUPER_ADMIN' | 'TEACHER');
  }

  /** CRM: thu hồi tài khoản học thử – khai báo trước PATCH :id để match đúng */
  @Delete(':id/trial-account')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async deleteTrialAccount(@Request() req: { user: { role: string } }, @Param('id') id: string) {
    try {
      return await this.service.deleteTrialAccount(id, req.user.role as 'SUPER_ADMIN' | 'TEACHER');
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      throw new InternalServerErrorException(`Xóa TK học thử thất bại: ${msg}`);
    }
  }

  /** CRM: hoàn duyệt – đưa về PENDING, xóa tài khoản User + enrollment, gửi email */
  @Patch(':id/revert')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  revert(@Request() req: { user: { role: string } }, @Param('id') id: string) {
    return this.service.revertApproval(id, req.user.role as 'SUPER_ADMIN' | 'TEACHER');
  }

  /** CRM: duyệt (approve → tạo tài khoản 24h + enrollment) */
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
