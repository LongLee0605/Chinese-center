import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { page?: number; limit?: number; status?: string } = {}) {
    const { page = 1, limit = 20, status } = params;
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          _count: { select: { lessons: true, quizzes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { quizzes: true } },
      },
    });
    if (!course) throw new NotFoundException('Khóa học không tồn tại');
    return course;
  }

  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        lessons: { where: { isPublished: true }, orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!course) throw new NotFoundException('Khóa học không tồn tại');
    return course;
  }

  async create(data: {
    code: string;
    name: string;
    nameZh?: string;
    description?: string;
    level: string;
    duration: number;
    maxStudents?: number;
    price: number;
    currency?: string;
    status?: string;
    slug: string;
    thumbnail?: string;
  }) {
    return this.prisma.course.create({
      data: {
        ...data,
        price: new Decimal(data.price),
        maxStudents: data.maxStudents ?? 20,
        currency: data.currency ?? 'VND',
        status: data.status ?? 'DRAFT',
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      code: string;
      name: string;
      nameZh: string;
      description: string;
      level: string;
      duration: number;
      maxStudents: number;
      price: number;
      currency: string;
      status: string;
      slug: string;
      thumbnail: string;
    }>,
  ) {
    await this.findOne(id);
    const payload: Record<string, unknown> = { ...data };
    if (data.price != null) payload.price = new Decimal(data.price);
    return this.prisma.course.update({
      where: { id },
      data: payload as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.course.delete({ where: { id } });
  }
}
