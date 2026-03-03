import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /** Super Admin: tất cả. Teacher: bản thân + học viên. */
  async findAll(
    params: { page?: number; limit?: number; role?: UserRole } = {},
    requesterId: string,
    requesterRole: UserRole,
  ) {
    const { page = 1, limit = 50, role } = params;
    const where: Record<string, unknown> = {};
    if (requesterRole === 'TEACHER') {
      where.OR = [{ id: requesterId }, { role: 'STUDENT' }];
    }
    if (role) where.role = role;
    const userSelect = {
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
      title: true,
      bio: true,
      avatar: true,
      specializations: true,
      yearsExperience: true,
      teacherPublic: true,
      teacherOrderIndex: true,
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: where as { role?: UserRole; OR?: { id: string; role: UserRole }[] },
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
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

  /** CRM/Web: xem chi tiết theo quyền; nếu là học viên thì kèm enrollments, progress %, quiz attempts. */
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
      },
    });
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');
    if (requesterRole === 'TEACHER' && user.id !== requesterId && user.role !== 'STUDENT') {
      throw new ForbiddenException('Bạn chỉ được xem bản thân và học viên.');
    }
    const result: Record<string, unknown> = { ...user };
    if (user.role === 'STUDENT') {
      result.enrollments = await this.getStudentEnrollments(user.id);
      result.quizAttempts = await this.getStudentQuizAttempts(user.id);
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
