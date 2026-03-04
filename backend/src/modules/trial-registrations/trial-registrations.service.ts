import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EnrollmentRequestStatus } from '@prisma/client';
import type { UserRoleOrGuest } from '../../core/visibility/visibility.util';
import { MailService } from '../mail/mail.service';
import {
  trialApprovedEmail,
  trialRejectedAlreadyUsedEmail,
  trialDeactivatedEmail,
  classRegistrationNotificationToCrm,
  classTrialApprovedEmail,
} from '../mail/templates/email-templates';

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

function getWebsiteUrl(config: ConfigService): string {
  return config.get<string>('WEBSITE_URL')?.trim() || 'https://chinese-center-web.pages.dev';
}

@Injectable()
export class TrialRegistrationsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

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
    const emailLower = email.toLowerCase();
    const course = await this.prisma.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true, name: true },
    });
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    const hadTrialBefore = await this.prisma.user.findFirst({
      where: { email: emailLower, isTrial: true },
    });
    if (hadTrialBefore) {
      const websiteUrl = getWebsiteUrl(this.config);
      const { subject, html, text } = trialRejectedAlreadyUsedEmail({ websiteUrl });
      await this.mail.send({
        to: emailLower,
        subject,
        html,
        text,
        saveToSent: false,
      });
      throw new BadRequestException(
        'Email này đã từng đăng ký học thử. Để học tiếp vui lòng liên hệ hoặc mua khóa học.',
      );
    }

    const existing = await this.prisma.trialRegistration.findFirst({
      where: {
        email: emailLower,
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
        email: emailLower,
        fullName,
        phone: dto.phone?.trim() || null,
        courseId: course.id,
        message: dto.message?.trim() || null,
        status: 'PENDING',
      },
      include: { course: { select: { id: true, name: true, slug: true } } },
    });
  }

  /**
   * Website: form Đăng ký lớp → tạo TrialRegistration (classId), gửi 1 mail đến CRM (Học thử).
   * Khi CRM duyệt → tạo user + ClassMembership (buổi classDate).
   */
  async createForClass(dto: {
    classId: string;
    email: string;
    fullName: string;
    phone?: string;
    message?: string;
    className?: string;
    classDate?: string; // ISO
  }) {
    const email = dto.email?.trim().toLowerCase();
    const fullName = dto.fullName?.trim();
    if (!email || !fullName) {
      throw new BadRequestException('Email và họ tên là bắt buộc.');
    }
    const c = await this.prisma.class.findUnique({
      where: { id: dto.classId },
      select: { id: true, name: true, status: true },
    });
    if (!c) throw new NotFoundException('Không tìm thấy lớp học.');
    if (c.status === 'CLOSED') throw new BadRequestException('Lớp đã đóng, không thể đăng ký.');

    const existing = await this.prisma.trialRegistration.findFirst({
      where: {
        email,
        classId: dto.classId,
        status: 'PENDING',
      },
    });
    if (existing) {
      throw new BadRequestException('Bạn đã gửi đăng ký lớp này, vui lòng chờ duyệt.');
    }

    let classDateParsed: Date | null = null;
    if (dto.classDate) {
      const d = new Date(dto.classDate);
      if (!Number.isNaN(d.getTime())) classDateParsed = d;
    }
    const className = dto.className?.trim() || c.name;

    const created = await this.prisma.trialRegistration.create({
      data: {
        email,
        fullName,
        phone: dto.phone?.trim() || null,
        classId: dto.classId,
        className,
        classDate: classDateParsed,
        message: dto.message?.trim() || null,
        status: 'PENDING',
      },
      include: { class: { select: { id: true, name: true } } },
    });

    const crmUrl = this.config.get<string>('CRM_URL')?.trim() || 'https://chinese-center-crm.pages.dev';
    const trialListUrl = `${crmUrl.replace(/\/$/, '')}/trial-registrations?status=PENDING`;
    const toCrm = this.config.get<string>('CRM_NOTIFICATION_EMAIL')?.trim()
      || this.config.get<string>('ADMIN_EMAIL')?.trim();
    const classDateStr = classDateParsed
      ? classDateParsed.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;
    if (toCrm) {
      const { subject, html, text } = classRegistrationNotificationToCrm({
        className,
        classDate: classDateStr,
        fullName: created.fullName,
        email: created.email,
        phone: created.phone,
        message: created.message,
        crmUrl: trialListUrl,
      });
      await this.mail.send({
        to: toCrm,
        subject,
        html,
        text,
        saveToSent: false,
      });
    }

    return created;
  }

  /**
   * CRM: xóa toàn bộ đăng ký học thử (chỉ SUPER_ADMIN). Không xóa User đã tạo.
   */
  async deleteAll(requesterRole: UserRoleOrGuest): Promise<{ deleted: number }> {
    if (requesterRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Chỉ Super Admin mới được xóa toàn bộ đăng ký học thử.');
    }
    const result = await this.prisma.trialRegistration.deleteMany({});
    return { deleted: result.count };
  }

  /**
   * CRM: làm sạch đăng ký học thử – set createdUserId = null khi user không tồn tại hoặc không còn trial.
   * Trả về số bản ghi đã cập nhật.
   */
  async cleanupOrphanedTrialLinks(requesterRole: UserRoleOrGuest): Promise<{ updated: number }> {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới thực hiện được.');
    }
    const withUserId = await this.prisma.trialRegistration.findMany({
      where: { status: 'APPROVED', createdUserId: { not: null } },
      select: { id: true, createdUserId: true },
    });
    let updated = 0;
    for (const reg of withUserId) {
      if (!reg.createdUserId) continue;
      const user = await this.prisma.user.findUnique({
        where: { id: reg.createdUserId },
        select: { id: true, isTrial: true },
      });
      const shouldClear = !user || !user.isTrial;
      if (shouldClear) {
        await this.prisma.$executeRaw`
          UPDATE trial_registrations SET "createdUserId" = NULL WHERE id = ${reg.id}
        `;
        updated += 1;
      }
    }
    return { updated };
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
          class: { select: { id: true, name: true } },
          createdUser: { select: { id: true, trialExpiresAt: true } },
        },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trialRegistration.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  /** CRM: hoàn duyệt – đưa về PENDING, xóa luôn tài khoản User trên hệ thống, gửi email thông báo */
  async revertApproval(id: string, requesterRole: UserRoleOrGuest) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới thực hiện được.');
    }
    const reg = await this.prisma.trialRegistration.findUnique({
      where: { id },
      include: { course: { select: { id: true, name: true, slug: true } }, class: { select: { id: true, name: true } } },
    });
    if (!reg) throw new NotFoundException('Không tìm thấy đăng ký học thử.');
    if (reg.status !== 'APPROVED' || !reg.createdUserId) {
      throw new BadRequestException('Chỉ có thể hoàn duyệt khi đăng ký đã được duyệt và có tài khoản học thử.');
    }
    const userId = reg.createdUserId;
    await this.prisma.$transaction(async (tx) => {
      if (reg.courseId) {
        await tx.courseEnrollment.deleteMany({
          where: { userId, courseId: reg.courseId },
        });
      }
      if (reg.classId) {
        await tx.classMembership.deleteMany({
          where: { userId, classId: reg.classId },
        });
      }
      await tx.trialRegistration.update({
        where: { id },
        data: {
          status: 'PENDING',
          reviewedAt: null,
          reviewedBy: null,
          createdUserId: null,
        },
      });
      await tx.user.delete({ where: { id: userId } });
    });
    const websiteUrl = getWebsiteUrl(this.config);
    const { subject, html, text } = trialDeactivatedEmail({ websiteUrl });
    await this.mail.send({
      to: reg.email,
      subject,
      html,
      text,
      saveToSent: false,
    });
    return this.prisma.trialRegistration.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, slug: true } },
        class: { select: { id: true, name: true } },
        createdUser: { select: { id: true, trialExpiresAt: true } },
      },
    });
  }

  /**
   * CRM: xóa tài khoản học thử – xóa luôn bản ghi User (sẽ biến mất khỏi danh sách Tài khoản).
   */
  async deleteTrialAccount(id: string, requesterRole: UserRoleOrGuest) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới thực hiện được.');
    }

    const reg = await this.prisma.trialRegistration.findUnique({
      where: { id },
      select: { id: true, status: true, createdUserId: true, courseId: true, classId: true },
    });
    if (!reg) throw new NotFoundException('Không tìm thấy đăng ký học thử.');
    if (reg.status !== 'APPROVED' || !reg.createdUserId) {
      throw new BadRequestException('Không có tài khoản học thử nào để xóa.');
    }
    const userId = reg.createdUserId;

    if (reg.classId) {
      await this.prisma.classMembership.deleteMany({
        where: { userId, classId: reg.classId },
      });
    }

    await this.prisma.$executeRaw`
      UPDATE trial_registrations SET "createdUserId" = NULL WHERE id = ${id}
    `;

    await this.prisma.user.delete({ where: { id: userId } });

    const updated = await this.prisma.trialRegistration.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, slug: true } },
        class: { select: { id: true, name: true } },
      },
    });
    if (!updated) throw new NotFoundException('Không tìm thấy đăng ký học thử.');
    return updated;
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
      include: { course: true, class: true },
    });
    if (!reg) throw new NotFoundException('Không tìm thấy đăng ký học thử.');
    if (reg.status !== 'PENDING')
      throw new BadRequestException('Yêu cầu đã được xử lý.');
    const reviewedAt = new Date();
    let plainPassword: string | null = null;

    if (body.status === 'APPROVED') {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: reg.email.toLowerCase() },
      });
      const trialExpiresAt = new Date(
        Date.now() + TRIAL_HOURS * 60 * 60 * 1000,
      );
      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        plainPassword = randomPassword(10);
        const hashed = await bcrypt.hash(plainPassword, 10);
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            password: hashed,
            isTrial: true,
            trialExpiresAt,
            status: 'ACTIVE',
          },
        });
      } else {
        const { firstName, lastName } = splitName(reg.fullName);
        plainPassword = randomPassword(10);
        const hashed = await bcrypt.hash(plainPassword, 10);
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

      const updateTrial = this.prisma.trialRegistration.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt,
          reviewedBy: reviewerId,
          createdUserId: userId,
        },
      });

      if (reg.classId) {
        await this.prisma.$transaction([
          this.prisma.classMembership.upsert({
            where: { classId_userId: { classId: reg.classId, userId } },
            create: { classId: reg.classId, userId },
            update: {},
          }),
          updateTrial,
        ]);
      } else if (reg.courseId) {
        await this.prisma.$transaction([
          this.prisma.courseEnrollment.upsert({
            where: { userId_courseId: { userId, courseId: reg.courseId } },
            create: { userId, courseId: reg.courseId },
            update: {},
          }),
          updateTrial,
        ]);
      } else {
        await updateTrial;
      }

      if (plainPassword) {
        const websiteUrl = getWebsiteUrl(this.config);
        if (reg.classId) {
          const className = reg.className || reg.class?.name || 'Lớp học';
          const classDateStr = reg.classDate
            ? reg.classDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
            : null;
          const { subject, html, text } = classTrialApprovedEmail({
            websiteUrl,
            className,
            classDate: classDateStr,
            email: reg.email,
            password: plainPassword,
            hours: TRIAL_HOURS,
          });
          await this.mail.send({
            to: reg.email,
            subject,
            html,
            text,
            saveToSent: false,
          });
        } else if (reg.course) {
          const { subject, html, text } = trialApprovedEmail({
            websiteUrl,
            courseName: reg.course.name,
            courseSlug: reg.course.slug,
            email: reg.email,
            password: plainPassword,
            hours: TRIAL_HOURS,
          });
          await this.mail.send({
            to: reg.email,
            subject,
            html,
            text,
            saveToSent: false,
          });
        }
      }
    } else {
      await this.prisma.trialRegistration.update({
        where: { id },
        data: { status: 'REJECTED', reviewedAt, reviewedBy: reviewerId },
      });
    }

    return this.prisma.trialRegistration.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, slug: true } },
        class: { select: { id: true, name: true } },
      },
    });
  }
}
