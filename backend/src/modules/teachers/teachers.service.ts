import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UserRole } from '@prisma/client';

/** Website: danh sách giáo viên lấy từ User (role = TEACHER, teacherPublic = true). Trả về shape giống cũ (name, title, bio, avatarPath, ...). */
@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findPublicList() {
    const users = await this.prisma.user.findMany({
      where: { role: UserRole.TEACHER, teacherPublic: true },
      orderBy: [{ teacherOrderIndex: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        title: true,
        bio: true,
        specializations: true,
        yearsExperience: true,
        teacherOrderIndex: true,
      },
    });
    const items = users.map((u) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || '—',
      title: u.title ?? undefined,
      bio: u.bio ?? undefined,
      avatarPath: u.avatar ?? undefined,
      specializations: u.specializations ?? [],
      yearsExperience: u.yearsExperience ?? undefined,
      orderIndex: u.teacherOrderIndex ?? 0,
    }));
    return { items };
  }
}
