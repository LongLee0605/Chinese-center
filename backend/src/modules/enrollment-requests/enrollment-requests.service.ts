import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EnrollmentRequestStatus } from '@prisma/client';
import type { UserRoleOrGuest } from '../../core/visibility/visibility.util';

@Injectable()
export class EnrollmentRequestsService {
  constructor(private prisma: PrismaService) {}

  /** Website (đã đăng nhập): gửi yêu cầu đăng ký khóa học */
  async create(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Khóa học không tồn tại');
    const alreadyEnrolled = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (alreadyEnrolled) throw new BadRequestException('Bạn đã đăng ký khóa học này.');
    const existing = await this.prisma.courseEnrollmentRequest.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      if (existing.status === 'PENDING') throw new BadRequestException('Bạn đã gửi yêu cầu, vui lòng chờ duyệt.');
      if (existing.status === 'APPROVED') throw new BadRequestException('Bạn đã được duyệt đăng ký khóa học này.');
    }
    return this.prisma.courseEnrollmentRequest.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: 'PENDING' },
      update: { status: 'PENDING', note: null, reviewedAt: null, reviewedBy: null },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        course: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /** CRM: danh sách yêu cầu (theo khóa hoặc tất cả) */
  async findAll(
    params: { courseId?: string; status?: EnrollmentRequestStatus; page?: number; limit?: number },
    requesterRole: UserRoleOrGuest,
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới xem được.');
    }
    const { courseId, status, page = 1, limit = 50 } = params;
    const where: { courseId?: string; status?: EnrollmentRequestStatus } = {};
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.courseEnrollmentRequest.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
          course: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.courseEnrollmentRequest.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  /** CRM: duyệt (approve/reject); approve thì tạo CourseEnrollment */
  async review(
    id: string,
    body: { status: 'APPROVED' | 'REJECTED'; note?: string },
    reviewerId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới duyệt được.');
    }
    const req = await this.prisma.courseEnrollmentRequest.findUnique({
      where: { id },
      include: { user: true, course: true },
    });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu.');
    if (req.status !== 'PENDING') throw new BadRequestException('Yêu cầu đã được xử lý.');
    const reviewedAt = new Date();
    if (body.status === 'APPROVED') {
      await this.prisma.$transaction([
        this.prisma.courseEnrollment.upsert({
          where: { userId_courseId: { userId: req.userId, courseId: req.courseId } },
          create: { userId: req.userId, courseId: req.courseId },
          update: {},
        }),
        this.prisma.courseEnrollmentRequest.update({
          where: { id },
          data: { status: 'APPROVED', note: body.note ?? null, reviewedAt, reviewedBy: reviewerId },
        }),
        // Mua/duyệt khóa học → chuyển tài khoản tạm (học thử) thành vĩnh viễn.
        this.prisma.user.update({
          where: { id: req.userId },
          data: { isTrial: false, trialExpiresAt: null },
        }),
      ]);
    } else {
      await this.prisma.courseEnrollmentRequest.update({
        where: { id },
        data: { status: 'REJECTED', note: body.note ?? null, reviewedAt, reviewedBy: reviewerId },
      });
    }
    return this.prisma.courseEnrollmentRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        course: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /** CRM: hoàn duyệt — chỉ áp dụng khi status = APPROVED. Xóa enrollment, chuyển yêu cầu về PENDING. */
  async revert(id: string, requesterRole: UserRoleOrGuest) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới thực hiện được.');
    }
    const req = await this.prisma.courseEnrollmentRequest.findUnique({
      where: { id },
      include: { user: true, course: true },
    });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu.');
    if (req.status !== 'APPROVED') {
      throw new BadRequestException('Chỉ có thể hoàn duyệt yêu cầu đã duyệt (Đã duyệt).');
    }
    await this.prisma.$transaction([
      this.prisma.courseEnrollment.deleteMany({
        where: { userId: req.userId, courseId: req.courseId },
      }),
      this.prisma.courseEnrollmentRequest.update({
        where: { id },
        data: { status: 'PENDING', note: null, reviewedAt: null, reviewedBy: null },
      }),
    ]);
    return this.prisma.courseEnrollmentRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        course: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /** CRM: xóa yêu cầu. Cho phép khi REJECTED hoặc PENDING. Nếu APPROVED thì phải hoàn duyệt trước. */
  async remove(id: string, requesterRole: UserRoleOrGuest) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới xóa được.');
    }
    const req = await this.prisma.courseEnrollmentRequest.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, courseId: true },
    });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu.');
    if (req.status === 'APPROVED') {
      throw new BadRequestException('Yêu cầu đã duyệt. Hãy dùng Hoàn duyệt trước khi xóa.');
    }
    await this.prisma.courseEnrollmentRequest.delete({ where: { id } });
    return { deleted: true, id };
  }
}
