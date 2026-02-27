import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  /** Public: chỉ giáo viên isPublic, cho website */
  async findPublicList() {
    const items = await this.prisma.teacher.findMany({
      where: { isPublic: true },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    });
    return { items };
  }

  /** CRM: tất cả giáo viên */
  async findAll(params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = params;
    const [items, total] = await Promise.all([
      this.prisma.teacher.findMany({
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.teacher.count(),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundException('Giáo viên không tồn tại');
    return teacher;
  }

  async create(dto: CreateTeacherDto) {
    return this.prisma.teacher.create({
      data: {
        name: dto.name,
        title: dto.title,
        bio: dto.bio,
        avatarPath: dto.avatarPath,
        specializations: dto.specializations ?? [],
        yearsExperience: dto.yearsExperience,
        isPublic: dto.isPublic ?? true,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    await this.findOne(id);
    return this.prisma.teacher.update({
      where: { id },
      data: {
        ...(dto.name != null && { name: dto.name }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarPath !== undefined && { avatarPath: dto.avatarPath }),
        ...(dto.specializations !== undefined && { specializations: dto.specializations }),
        ...(dto.yearsExperience !== undefined && { yearsExperience: dto.yearsExperience }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.teacher.delete({ where: { id } });
  }
}
