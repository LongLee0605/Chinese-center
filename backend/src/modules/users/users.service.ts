import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /** Xóa tài khoản học thử đã hết hạn (isTrial = true và trialExpiresAt < now). Gọi trước khi list. */
  async cleanupExpiredTrialUsers(): Promise<number> {
    const result = await this.prisma.user.deleteMany({
      where: {
        isTrial: true,
        trialExpiresAt: { not: null, lt: new Date() },
      },
    });
    return result.count;
  }

  /** Super Admin: tất cả. Teacher: bản thân + chỉ học viên thuộc lớp mình dạy. accountType: official | trial để lọc. Cleanup trial hết hạn chạy ở auth login, không chạy mỗi lần list. */
  async findAll(
    params: { page?: number; limit?: number; role?: UserRole; accountType?: 'all' | 'official' | 'trial' } = {},
    requesterId: string,
    requesterRole: UserRole,
  ) {
    const { page = 1, limit = 50, role, accountType = 'all' } = params;
    const where: Record<string, unknown> = {};
    if (requesterRole === 'TEACHER') {
      where.OR = [
        { id: requesterId },
        {
          role: 'STUDENT',
          classMemberships: {
            some: { class: { teacherId: requesterId } },
          },
        },
      ];
    }
    if (role) where.role = role;
    if (accountType === 'official') where.isTrial = false;
    if (accountType === 'trial') where.isTrial = true;

    const [rawItems, total] = await Promise.all([
      this.prisma.user.findMany({
        where: where as any,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          isTrial: true,
          trialExpiresAt: true,
          title: true,
          bio: true,
          avatar: true,
          specializations: true,
          yearsExperience: true,
          teacherPublic: true,
          teacherOrderIndex: true,
          classMemberships: {
            include: { class: { select: { id: true, name: true, status: true } } },
          },
          taughtClasses: {
            select: { id: true, name: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where: where as any }),
    ]);

    const items = rawItems.map((u) => {
      const { classMemberships, taughtClasses, ...rest } = u as any;
      if (u.role === 'STUDENT' && classMemberships?.length) {
        const currentClasses = classMemberships
          .filter((m: { class: { status: string } }) => m.class.status === 'OPEN')
          .map((m: { class: { id: string; name: string; status: string } }) => m.class);
        const pastClasses = classMemberships
          .filter((m: { class: { status: string } }) => m.class.status === 'CLOSED')
          .map((m: { class: { id: string; name: string; status: string } }) => m.class);
        return { ...rest, currentClasses, pastClasses };
      }
      if (u.role === 'TEACHER' && taughtClasses?.length) {
        const classesTeachingCurrent = taughtClasses.filter((c: { status: string }) => c.status === 'OPEN');
        const classesTeachingPast = taughtClasses.filter((c: { status: string }) => c.status === 'CLOSED');
        return { ...rest, classesTeachingCurrent, classesTeachingPast };
      }
      return {
        ...rest,
        ...(u.role === 'STUDENT' && { currentClasses: [], pastClasses: [] }),
        ...(u.role === 'TEACHER' && { classesTeachingCurrent: [], classesTeachingPast: [] }),
      };
    });
    return { items, total, page, limit };
  }

  /** Internal: chỉ kiểm tra tồn tại (dùng cho update/remove). */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
        title: true,
        bio: true,
        specializations: true,
        yearsExperience: true,
        teacherPublic: true,
        teacherOrderIndex: true,
      },
    });
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');
    return user;
  }

  /** CRM/Web: xem chi tiết theo quyền. Teacher chỉ xem được học viên thuộc lớp mình dạy. Học viên: kèm lớp đang học / từng học; Giảng viên: kèm lớp đang dạy / từng dạy. */
  async findOneWithDetail(id: string, requesterId: string, requesterRole: UserRole) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
        title: true,
        bio: true,
        specializations: true,
        yearsExperience: true,
        teacherPublic: true,
        teacherOrderIndex: true,
        isTrial: true,
        trialExpiresAt: true,
      },
    });
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');
    if (requesterRole === 'TEACHER' && user.id !== requesterId) {
      if (user.role !== 'STUDENT') {
        throw new ForbiddenException('Bạn chỉ được xem bản thân và học viên thuộc lớp mình.');
      }
      const inMyClass = await this.prisma.classMembership.findFirst({
        where: { userId: id, class: { teacherId: requesterId } },
      });
      if (!inMyClass) {
        throw new ForbiddenException('Bạn chỉ được xem học viên thuộc lớp mình phụ trách.');
      }
    }
    const result: Record<string, unknown> = { ...user };
    if (user.role === 'STUDENT') {
      result.enrollments = await this.getStudentEnrollments(user.id);
      result.quizAttempts = await this.getStudentQuizAttempts(user.id);
      const memberships = await this.prisma.classMembership.findMany({
        where: { userId: user.id },
        include: { class: { select: { id: true, name: true, status: true, closedAt: true } } },
      });
      result.classesCurrent = memberships
        .filter((m) => m.class.status === 'OPEN')
        .map((m) => ({ id: m.class.id, name: m.class.name, status: m.class.status }));
      result.classesPast = memberships
        .filter((m) => m.class.status === 'CLOSED')
        .map((m) => ({ id: m.class.id, name: m.class.name, status: m.class.status, closedAt: m.class.closedAt }));
    }
    if (user.role === 'TEACHER') {
      const taught = await this.prisma.class.findMany({
        where: { teacherId: user.id },
        select: { id: true, name: true, status: true, closedAt: true },
      });
      result.classesTeachingCurrent = taught.filter((c) => c.status === 'OPEN').map((c) => ({ id: c.id, name: c.name, status: c.status }));
      result.classesTeachingPast = taught.filter((c) => c.status === 'CLOSED').map((c) => ({ id: c.id, name: c.name, status: c.status, closedAt: c.closedAt }));
    }
    return result;
  }

  private async getStudentEnrollments(userId: string) {
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: { lessons: { select: { id: true } } },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
    const progress = await this.prisma.lessonProgress.findMany({
      where: { userId },
      select: { lessonId: true },
    });
    const progressSet = new Set(progress.map((p) => p.lessonId));
    return enrollments.map((e) => {
      const totalLessons = e.course.lessons?.length ?? 0;
      const completedLessons = e.course.lessons?.filter((l) => progressSet.has(l.id)).length ?? 0;
      const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return {
        courseId: e.course.id,
        courseName: e.course.name,
        courseSlug: e.course.slug,
        enrolledAt: e.enrolledAt,
        totalLessons,
        completedLessons,
        percentProgress: percent,
      };
    });
  }

  private async getStudentQuizAttempts(userId: string) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    return attempts.map((a) => ({
      id: a.id,
      quizId: a.quiz.id,
      quizTitle: a.quiz.title,
      quizSlug: a.quiz.slug,
      score: a.score,
      submittedAt: a.submittedAt,
    }));
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email đã tồn tại');
    const hashed = await bcrypt.hash(dto.password, 10);
    const data: Record<string, unknown> = {
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
      status: dto.status ?? 'PENDING_VERIFICATION',
    };
    if (dto.role === 'TEACHER') {
      data.title = dto.title ?? null;
      data.bio = dto.bio ?? null;
      data.specializations = Array.isArray(dto.specializations) ? dto.specializations : [];
      data.yearsExperience = dto.yearsExperience ?? null;
      data.teacherPublic = dto.teacherPublic ?? true;
      data.teacherOrderIndex = dto.teacherOrderIndex ?? 0;
    }
    const user = await this.prisma.user.create({
      data: data as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        title: true,
        bio: true,
        avatar: true,
        specializations: true,
        yearsExperience: true,
        teacherPublic: true,
        teacherOrderIndex: true,
        createdAt: true,
      },
    });
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('Email đã tồn tại');
    }
    const data: Record<string, unknown> = {
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.specializations !== undefined && { specializations: dto.specializations }),
      ...(dto.yearsExperience !== undefined && { yearsExperience: dto.yearsExperience }),
      ...(dto.teacherPublic !== undefined && { teacherPublic: dto.teacherPublic }),
      ...(dto.teacherOrderIndex !== undefined && { teacherOrderIndex: dto.teacherOrderIndex }),
    };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        title: true,
        bio: true,
        specializations: true,
        yearsExperience: true,
        teacherPublic: true,
        teacherOrderIndex: true,
        updatedAt: true,
      },
    });
  }

  async updateAvatar(id: string, avatarPath: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { avatar: avatarPath },
      select: { id: true, avatar: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
      select: { id: true, email: true },
    });
  }
}
