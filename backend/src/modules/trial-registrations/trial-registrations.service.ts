import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EnrollmentRequestStatus } from '@prisma/client';
import type { UserRoleOrGuest } from '../../core/visibility/visibility.util';

const TRIAL_HOURS = 24;

function randomPassword(length = 12): string {
  return randomBytes(length)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, length);
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1)
    return { firstName: fullName.trim() || 'User', lastName: '' };
  const lastName = parts.pop()!;
  const firstName = parts.join(' ');
  return { firstName, lastName };
}

@Injectable()
export class TrialRegistrationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    email: string;
    fullName: string;
    phone?: string;
    courseSlug: string;
    message?: string;
  }) {
    const email = dto.email?.trim();
    const fullName = dto.fullName?.trim();
    const courseSlug = dto.courseSlug?.trim();
    if (!email || !fullName || !courseSlug) {
      throw new BadRequestException('Email, họ tên và khóa học là bắt buộc.');
    }
    const course = await this.prisma.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true, name: true },
    });
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    const existing = await this.prisma.trialRegistration.findFirst({
      where: {
        email: email.toLowerCase(),
        courseId: course.id,
        status: 'PENDING',
      },
    });
    if (existing)
      throw new BadRequestException(
        'Bạn đã gửi yêu cầu học thử khóa này, vui lòng chờ duyệt.',
      );
    return this.prisma.trialRegistration.create({
      data: {
        email: email.toLowerCase(),
        fullName,
        phone: dto.phone?.trim() || null,
        courseId: course.id,
        message: dto.message?.trim() || null,
        status: 'PENDING',
      },
      include: { course: { select: { id: true, name: true, slug: true } } },
    });
  }

  async findAll(
    params: {
      courseId?: string;
      status?: EnrollmentRequestStatus;
      page?: number;
      limit?: number;
    },
    requesterRole: UserRoleOrGuest,
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới xem được.');
    }
    const { courseId, status, page = 1, limit = 50 } = params;
    const where: {
      courseId?: string;
      status?: EnrollmentRequestStatus;
    } = {};
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.trialRegistration.findMany({
        where,
        include: {
          course: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trialRegistration.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async review(
    id: string,
    body: { status: 'APPROVED' | 'REJECTED'; note?: string },
    reviewerId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới duyệt được.');
    }
    const reg = await this.prisma.trialRegistration.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!reg) throw new NotFoundException('Không tìm thấy đăng ký học thử.');
    if (reg.status !== 'PENDING')
      throw new BadRequestException('Yêu cầu đã được xử lý.');
    const reviewedAt = new Date();
    if (body.status === 'APPROVED') {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: reg.email.toLowerCase() },
      });
      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            isTrial: true,
            trialExpiresAt: new Date(
              Date.now() + TRIAL_HOURS * 60 * 60 * 1000,
            ),
            status: 'ACTIVE',
          },
        });
      } else {
        const { firstName, lastName } = splitName(reg.fullName);
        const password = randomPassword(10);
        const hashed = await bcrypt.hash(password, 10);
        const trialExpiresAt = new Date(
          Date.now() + TRIAL_HOURS * 60 * 60 * 1000,
        );
        const newUser = await this.prisma.user.create({
          data: {
            email: reg.email.toLowerCase(),
            password: hashed,
            firstName,
            lastName: lastName || firstName,
            phone: reg.phone,
            role: 'STUDENT',
            status: 'ACTIVE',
            isTrial: true,
            trialExpiresAt,
          },
          select: { id: true },
        });
        userId = newUser.id;
      }
      await this.prisma.$transaction([
        this.prisma.courseEnrollment.upsert({
          where: { userId_courseId: { userId, courseId: reg.courseId } },
          create: { userId, courseId: reg.courseId },
          update: {},
        }),
        this.prisma.trialRegistration.update({
          where: { id },
          data: {
            status: 'APPROVED',
            reviewedAt,
            reviewedBy: reviewerId,
            createdUserId: userId,
          },
        }),
      ]);
    } else {
      await this.prisma.trialRegistration.update({
        where: { id },
        data: { status: 'REJECTED', reviewedAt, reviewedBy: reviewerId },
      });
    }
    return this.prisma.trialRegistration.findUnique({
      where: { id },
      include: { course: { select: { id: true, name: true, slug: true } } },
    });
  }
}
