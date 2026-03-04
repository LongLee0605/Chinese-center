import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ClassStatus } from '@prisma/client';
import type { UserRoleOrGuest } from '../../core/visibility/visibility.util';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { classRegistrationApprovedEmail } from '../mail/templates/email-templates';

/** Bọc lỗi Prisma: bảng/cột chưa khớp schema hoặc client chưa generate → ném lỗi rõ ràng. */
function handleClassesPrismaError(err: unknown): never {
  const prismaErr = err as { code?: string; message?: string };
  const msg = typeof prismaErr?.message === 'string' ? prismaErr.message : '';
  // P2021: table does not exist, P2022: column does not exist
  if (
    prismaErr?.code === 'P2021' ||
    prismaErr?.code === 'P2022' ||
    msg.includes('does not exist')
  ) {
    throw new InternalServerErrorException(
      'Schema database chưa khớp (thiếu bảng/cột lớp học). Chạy: npx prisma migrate deploy (hoặc npx prisma db push)',
    );
  }
  if (err instanceof TypeError && (err as Error).message?.includes('findMany')) {
    throw new InternalServerErrorException(
      'Prisma client chưa có model Class. Chạy: npx prisma generate',
    );
  }
  throw err;
}

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  /** Super Admin: tất cả lớp. Teacher: chỉ lớp mình dạy. */
  async findAll(
    params: { page?: number; limit?: number; status?: ClassStatus },
    requesterId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 50));
    const status = params.status;
    const where: { status?: ClassStatus; teacherId?: string } = {};
    if (requesterRole === 'TEACHER' && requesterId) {
      where.teacherId = requesterId;
    }
    if (status) where.status = status;

    try {
      const [rows, total] = await Promise.all([
        this.prisma.class.findMany({
          where,
          include: {
            teacher: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            _count: { select: { members: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.class.count({ where }),
      ]);
      const classIds = rows.map((c) => c.id);
      const approvedGuestCounts =
        classIds.length > 0
          ? await this.prisma.classRegistrationRequest.groupBy({
              by: ['classId'],
              where: { classId: { in: classIds }, status: 'APPROVED' },
              _count: { id: true },
            })
          : [];
      const approvedByClassId = new Map(approvedGuestCounts.map((x) => [x.classId, x._count.id]));
      const items = rows.map((c) => {
        const members = (c as { _count?: { members?: number } })._count?.members ?? 0;
        const approvedGuests = approvedByClassId.get(c.id) ?? 0;
        return { ...c, memberCount: members + approvedGuests };
      });
      return { items, total, page, limit };
    } catch (e) {
      handleClassesPrismaError(e);
    }
  }

  async findOne(id: string, requesterId: string, requesterRole: UserRoleOrGuest) {
    let c;
    try {
      c = await this.prisma.class.findUnique({
        where: { id },
        include: {
          teacher: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          guestRequests: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              className: true,
              classDate: true,
              email: true,
              fullName: true,
              phone: true,
              message: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });
    } catch (e) {
      handleClassesPrismaError(e);
    }
    if (!c) throw new NotFoundException('Không tìm thấy lớp học.');
    if (requesterRole === 'TEACHER' && c.teacherId !== requesterId) {
      throw new ForbiddenException('Bạn chỉ được xem lớp mình phụ trách.');
    }
    return c;
  }

  /** TEACHER: lớp do mình dạy. SUPER_ADMIN: có thể truyền teacherId để gán giảng viên. */
  async create(
    dto: {
      name: string;
      teacherId?: string;
      scheduleDayOfWeek?: number[];
      scheduleStartTime?: string;
      scheduleEndTime?: string;
      room?: string;
      maxMembers?: number;
    },
    requesterId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới tạo được lớp.');
    }
    const teacherId =
      requesterRole === 'TEACHER' ? requesterId : (dto.teacherId ?? requesterId);
    if (requesterRole === 'SUPER_ADMIN' && dto.teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: dto.teacherId },
        select: { role: true },
      });
      if (!teacher || teacher.role !== 'TEACHER') {
        throw new BadRequestException('teacherId phải là tài khoản giảng viên.');
      }
    }
    const data: Record<string, unknown> = {
      name: dto.name.trim(),
      teacherId,
      scheduleDayOfWeek: dto.scheduleDayOfWeek ?? [],
      scheduleStartTime: dto.scheduleStartTime ?? null,
      scheduleEndTime: dto.scheduleEndTime ?? null,
      room: dto.room ?? null,
      maxMembers: dto.maxMembers ?? null,
    };
    return this.prisma.class.create({
      data: data as any,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async update(
    id: string,
    dto: {
      name?: string;
      teacherId?: string;
      scheduleDayOfWeek?: number[];
      scheduleStartTime?: string;
      scheduleEndTime?: string;
      room?: string;
      maxMembers?: number;
    },
    requesterId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    const c = await this.prisma.class.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Không tìm thấy lớp học.');
    if (requesterRole === 'TEACHER' && c.teacherId !== requesterId) {
      throw new ForbiddenException('Bạn chỉ được sửa lớp mình phụ trách.');
    }
    if (c.status === 'CLOSED') {
      throw new BadRequestException('Không thể sửa lớp đã đóng.');
    }
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (requesterRole === 'SUPER_ADMIN' && dto.teacherId !== undefined) data.teacherId = dto.teacherId;
    if (dto.scheduleDayOfWeek !== undefined) data.scheduleDayOfWeek = dto.scheduleDayOfWeek;
    if (dto.scheduleStartTime !== undefined) data.scheduleStartTime = dto.scheduleStartTime;
    if (dto.scheduleEndTime !== undefined) data.scheduleEndTime = dto.scheduleEndTime;
    if (dto.room !== undefined) data.room = dto.room;
    if (dto.maxMembers !== undefined) data.maxMembers = dto.maxMembers;
    return this.prisma.class.update({
      where: { id },
      data,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { members: true } },
      },
    });
  }

  /** Đóng lớp: status = CLOSED, closedAt = now. */
  async close(id: string, requesterId: string, requesterRole: UserRoleOrGuest) {
    const c = await this.prisma.class.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Không tìm thấy lớp học.');
    if (requesterRole === 'TEACHER' && c.teacherId !== requesterId) {
      throw new ForbiddenException('Bạn chỉ được đóng lớp mình phụ trách.');
    }
    if (c.status === 'CLOSED') throw new BadRequestException('Lớp đã đóng.');
    return this.prisma.class.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async addMember(
    classId: string,
    userId: string,
    requesterId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    const c = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!c) throw new NotFoundException('Không tìm thấy lớp học.');
    if (requesterRole === 'TEACHER' && c.teacherId !== requesterId) {
      throw new ForbiddenException('Bạn chỉ được thêm học viên vào lớp mình phụ trách.');
    }
    if (c.status === 'CLOSED') throw new BadRequestException('Không thể thêm vào lớp đã đóng.');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    if (user.role !== 'STUDENT') {
      throw new BadRequestException('Chỉ thêm được học viên (STUDENT) vào lớp.');
    }
    await this.prisma.classMembership.upsert({
      where: { classId_userId: { classId, userId } },
      create: { classId, userId },
      update: {},
    });
    return this.findOne(classId, requesterId, requesterRole);
  }

  async removeMember(
    classId: string,
    userId: string,
    requesterId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    const c = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!c) throw new NotFoundException('Không tìm thấy lớp học.');
    if (requesterRole === 'TEACHER' && c.teacherId !== requesterId) {
      throw new ForbiddenException('Bạn chỉ được xóa học viên khỏi lớp mình phụ trách.');
    }
    if (c.status === 'CLOSED') throw new BadRequestException('Không thể sửa thành viên lớp đã đóng.');
    await this.prisma.classMembership.deleteMany({
      where: { classId, userId },
    });
    return this.findOne(classId, requesterId, requesterRole);
  }

  async remove(id: string, requesterId: string, requesterRole: UserRoleOrGuest) {
    const c = await this.prisma.class.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Không tìm thấy lớp học.');
    if (requesterRole === 'TEACHER' && c.teacherId !== requesterId) {
      throw new ForbiddenException('Bạn chỉ được xóa lớp mình phụ trách.');
    }
    return this.prisma.class.delete({
      where: { id },
      select: { id: true, name: true },
    });
  }

  /** Website: danh sách lớp OPEN có lịch, cho calendar & đăng ký. Không cần auth. */
  async getPublicSchedule() {
    try {
      const rows = await this.prisma.class.findMany({
        where: { status: 'OPEN' },
        select: {
          id: true,
          name: true,
          scheduleDayOfWeek: true,
          scheduleStartTime: true,
          scheduleEndTime: true,
          room: true,
          maxMembers: true,
          teacher: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: { select: { members: true } },
        },
        orderBy: [{ scheduleStartTime: 'asc' }, { name: 'asc' }],
      });
      const classIds = rows.map((c) => c.id);
      const approvedGuestCounts =
        classIds.length > 0
          ? await this.prisma.classRegistrationRequest.groupBy({
              by: ['classId'],
              where: { classId: { in: classIds }, status: 'APPROVED' },
              _count: { id: true },
            })
          : [];
      const approvedByClassId = new Map(approvedGuestCounts.map((x) => [x.classId, x._count.id]));
      const items = rows.map((c) => {
        const members = (c as { _count?: { members?: number } })._count?.members ?? 0;
        const approvedGuests = approvedByClassId.get(c.id) ?? 0;
        return { ...c, memberCount: members + approvedGuests };
      });
      return { items };
    } catch (e) {
      handleClassesPrismaError(e);
    }
  }

  /** Tổng sĩ số = học viên đã kích hoạt (members) + đơn đăng ký đã duyệt (APPROVED, chưa kích hoạt). */
  private async getClassTotalOccupancy(classId: string): Promise<number> {
    const [membersCount, approvedGuestsCount] = await Promise.all([
      this.prisma.classMembership.count({ where: { classId } }),
      this.prisma.classRegistrationRequest.count({ where: { classId, status: 'APPROVED' } }),
    ]);
    return membersCount + approvedGuestsCount;
  }

  /** Website: học viên đã đăng nhập tự đăng ký vào lớp. */
  async joinClass(classId: string, userId: string) {
    const c = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, status: true, maxMembers: true },
    });
    if (!c) throw new NotFoundException('Không tìm thấy lớp học.');
    if (c.status === 'CLOSED') throw new BadRequestException('Lớp đã đóng, không thể đăng ký.');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || user.role !== 'STUDENT') {
      throw new BadRequestException('Chỉ tài khoản học viên mới được đăng ký lớp.');
    }
    const existing = await this.prisma.classMembership.findUnique({
      where: { classId_userId: { classId, userId } },
    });
    if (existing) throw new BadRequestException('Bạn đã ở trong lớp này.');
    const totalOccupancy = await this.getClassTotalOccupancy(classId);
    if (c.maxMembers != null && totalOccupancy >= c.maxMembers) {
      throw new BadRequestException('Lớp đã đủ số lượng.');
    }
    await this.prisma.classMembership.create({
      data: { classId, userId },
    });
    return { success: true, message: 'Đã đăng ký vào lớp.' };
  }

  /** Website: khách gửi form đăng ký lớp → tạo ClassRegistrationRequest. Quản lý trong CRM Chi tiết lớp, duyệt thì gửi mail. */
  async registerRequest(
    classId: string,
    body: {
      email: string;
      fullName: string;
      phone?: string;
      message?: string;
      className?: string;
      classDate?: string;
    },
  ) {
    const c = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, status: true, maxMembers: true },
    });
    if (!c) throw new NotFoundException('Không tìm thấy lớp học.');
    if (c.status === 'CLOSED') throw new BadRequestException('Lớp đã đóng, không thể đăng ký.');
    const totalOccupancy = await this.getClassTotalOccupancy(classId);
    if (c.maxMembers != null && totalOccupancy >= c.maxMembers) {
      throw new BadRequestException('Lớp đã đủ số lượng. Không thể gửi đăng ký mới. Vui lòng chọn lớp khác hoặc chờ có học viên hủy.');
    }
    const email = body.email?.trim().toLowerCase();
    const fullName = body.fullName?.trim();
    if (!email || !fullName) throw new BadRequestException('Email và họ tên là bắt buộc.');

    // Đã đăng ký lớp này thì không cho đăng ký lại; chỉ có thể hủy (liên hệ trung tâm) rồi mới đăng ký lại.
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      const inClass = await this.prisma.classMembership.findUnique({
        where: { classId_userId: { classId, userId: existingUser.id } },
      });
      if (inClass) {
        throw new BadRequestException(
          'Email này đã đăng ký lớp này. Nếu muốn hủy đăng ký để đăng ký lại, vui lòng liên hệ trung tâm.',
        );
      }
    }
    const existingRequest = await this.prisma.classRegistrationRequest.findFirst({
      where: {
        classId,
        email,
        status: { in: ['PENDING', 'CONTACTED', 'APPROVED'] },
      },
    });
    if (existingRequest) {
      throw new BadRequestException(
        'Email này đã có đơn đăng ký lớp này (đang chờ hoặc đã duyệt). Nếu muốn hủy để đăng ký lại, vui lòng liên hệ trung tâm.',
      );
    }

    let classDate: Date | null = null;
    if (body.classDate) {
      const d = new Date(body.classDate);
      if (!Number.isNaN(d.getTime())) classDate = d;
    }
    await this.prisma.classRegistrationRequest.create({
      data: {
        classId,
        className: body.className?.trim() || c.name,
        classDate,
        email,
        fullName,
        phone: body.phone?.trim() || null,
        message: body.message?.trim() || null,
      },
    });
    return { success: true, message: 'Đã gửi đăng ký. Chúng tôi sẽ liên hệ bạn sớm.' };
  }

  /** CRM: duyệt đăng ký lớp (học offline). Có tài khoản → thêm vào lớp (đã kích hoạt). Chưa có TK → chỉ gửi email, hiển thị ở "chưa kích hoạt". */
  async approveRegistrationRequest(
    classId: string,
    requestId: string,
    requesterId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới duyệt được.');
    }
    const req = await this.prisma.classRegistrationRequest.findFirst({
      where: { id: requestId, classId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            room: true,
            scheduleStartTime: true,
            scheduleEndTime: true,
            scheduleDayOfWeek: true,
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu đăng ký.');
    if (req.status === 'APPROVED') throw new BadRequestException('Yêu cầu đã được duyệt.');
    if (req.status === 'REJECTED') throw new BadRequestException('Yêu cầu đã bị từ chối.');

    const emailLower = req.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailLower },
      select: { id: true },
    });

    if (existingUser) {
      const cls = await this.prisma.class.findUnique({
        where: { id: classId },
        select: { maxMembers: true },
      });
      const totalOccupancy = await this.getClassTotalOccupancy(classId);
      if (cls?.maxMembers != null && totalOccupancy >= cls.maxMembers) {
        throw new BadRequestException('Lớp đã đủ số lượng. Không thể duyệt thêm đăng ký.');
      }
      await this.prisma.$transaction([
        this.prisma.classMembership.upsert({
          where: { classId_userId: { classId, userId: existingUser.id } },
          create: { classId, userId: existingUser.id },
          update: {},
        }),
        this.prisma.classRegistrationRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        }),
      ]);
    } else {
      await this.prisma.classRegistrationRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });
    }

    const websiteUrl = this.config.get<string>('WEBSITE_URL')?.trim() || 'https://chinese-center-web.pages.dev';
    const scheduleUrl = `${websiteUrl.replace(/\/$/, '')}/lich-hoc`;
    const teacherName = req.class.teacher
      ? `${req.class.teacher.firstName} ${req.class.teacher.lastName}`
      : '—';
    const timeStr =
      req.class.scheduleStartTime && req.class.scheduleEndTime
        ? `${req.class.scheduleStartTime} – ${req.class.scheduleEndTime}`
        : '—';
    const daysStr =
      req.class.scheduleDayOfWeek?.length && Array.isArray(req.class.scheduleDayOfWeek)
        ? (req.class.scheduleDayOfWeek as number[])
            .map((d) => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d] ?? `T${d + 1}`)
            .join(', ')
        : '—';
    const scheduleText = req.classDate
      ? `${req.classDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} · ${timeStr}`
      : `${daysStr} · ${timeStr}`;

    const { subject, html, text } = classRegistrationApprovedEmail({
      fullName: req.fullName,
      email: req.email,
      phone: req.phone ?? '',
      className: req.className ?? req.class.name,
      scheduleText,
      teacherName,
      room: req.class.room ?? '',
      scheduleUrl,
    });
    await this.mail.send({
      to: req.email,
      subject,
      html,
      text,
      saveToSent: false,
    });

    return this.findOne(classId, requesterId, requesterRole);
  }

  /** CRM: từ chối đăng ký lớp. */
  async rejectRegistrationRequest(
    classId: string,
    requestId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới thực hiện được.');
    }
    const req = await this.prisma.classRegistrationRequest.findFirst({
      where: { id: requestId, classId },
    });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu đăng ký.');
    if (req.status !== 'PENDING' && req.status !== 'CONTACTED') {
      throw new BadRequestException('Chỉ có thể từ chối yêu cầu đang chờ xử lý.');
    }
    await this.prisma.classRegistrationRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
    return { success: true };
  }

  /** CRM: hoàn duyệt — chỉ với đơn đã duyệt; chuyển về chờ duyệt và bỏ học viên khỏi lớp. */
  async revertRegistrationRequest(
    classId: string,
    requestId: string,
    requesterId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới thực hiện được.');
    }
    const req = await this.prisma.classRegistrationRequest.findFirst({
      where: { id: requestId, classId },
    });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu đăng ký.');
    if (req.status !== 'APPROVED') {
      throw new BadRequestException('Chỉ có thể hoàn duyệt đơn đã được duyệt.');
    }
    const emailLower = req.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: emailLower },
      select: { id: true },
    });
    await this.prisma.$transaction(async (tx) => {
      if (user) {
        await tx.classMembership.deleteMany({
          where: { classId, userId: user.id },
        });
      }
      await tx.classRegistrationRequest.update({
        where: { id: requestId },
        data: { status: 'PENDING' },
      });
    });
    return this.findOne(classId, requesterId, requesterRole);
  }

  /** CRM: xóa đơn đăng ký. Nếu đơn đã duyệt thì đồng thời bỏ học viên khỏi lớp. */
  async deleteRegistrationRequest(
    classId: string,
    requestId: string,
    requesterRole: UserRoleOrGuest,
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới thực hiện được.');
    }
    const req = await this.prisma.classRegistrationRequest.findFirst({
      where: { id: requestId, classId },
    });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu đăng ký.');
    const emailLower = req.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: emailLower },
      select: { id: true },
    });
    await this.prisma.$transaction(async (tx) => {
      if (req.status === 'APPROVED' && user) {
        await tx.classMembership.deleteMany({
          where: { classId, userId: user.id },
        });
      }
      await tx.classRegistrationRequest.delete({
        where: { id: requestId },
      });
    });
    return { success: true };
  }
}
