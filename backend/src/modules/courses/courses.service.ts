import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/** Chuyển course từ Prisma sang plain object có thể serialize JSON (price: Decimal → number). */
function serializeCourse(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    if (key === 'price') {
      const p = row.price;
      out.price =
        p != null && typeof p === 'object' && typeof (p as { toNumber?: () => number }).toNumber === 'function'
          ? (p as { toNumber: () => number }).toNumber()
          : Number(p ?? 0);
    } else {
      out[key] = row[key];
    }
  }
  return out;
}

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
    return { items: items.map(serializeCourse), total, page, limit };
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
    return serializeCourse(course);
  }

  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        lessons: { where: { isPublished: true }, orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!course) throw new NotFoundException('Khóa học không tồn tại');
    return serializeCourse(course);
  }

  async create(data: {
    code?: string;
    name?: string;
    nameZh?: string;
    description?: string;
    learningObjectives?: string;
    level?: string;
    duration?: number;
    maxStudents?: number;
    price?: number;
    currency?: string;
    status?: string;
    slug?: string;
    thumbnail?: string;
  }) {
    const code = String(data.code ?? '').trim();
    const name = String(data.name ?? '').trim();
    const slug = String(data.slug ?? '').trim();
    if (!code || !name || !slug) {
      throw new BadRequestException('code, name và slug là bắt buộc');
    }
    const duration = Number(data.duration);
    const maxStudents = Number(data.maxStudents);
    const priceRaw = data.price as number | string | undefined | null;
    const price = (priceRaw !== undefined && priceRaw !== null && priceRaw !== '')
      ? Number(priceRaw)
      : 0;

    const created = await this.prisma.course.create({
      data: {
        code,
        name,
        nameZh: data.nameZh != null && data.nameZh !== '' ? String(data.nameZh).trim() : null,
        description: data.description != null && data.description !== '' ? String(data.description).trim() : null,
        learningObjectives: data.learningObjectives != null && data.learningObjectives !== '' ? String(data.learningObjectives).trim() : null,
        level: String(data.level ?? 'HSK1'),
        duration: Number.isFinite(duration) ? duration : 0,
        maxStudents: Number.isFinite(maxStudents) && maxStudents > 0 ? maxStudents : 20,
        price: new Decimal(price),
        currency: data.currency && String(data.currency).trim() ? String(data.currency).trim() : 'VND',
        status: data.status && String(data.status).trim() ? String(data.status).trim() : 'DRAFT',
        slug,
        thumbnail: data.thumbnail != null && data.thumbnail !== '' ? String(data.thumbnail).trim() : null,
      },
    });
    return serializeCourse(created);
  }

  async update(
    id: string,
    data: Partial<{
      code: string;
      name: string;
      nameZh: string;
      description: string;
      learningObjectives: string;
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
    const updateData: Record<string, unknown> = {};
    const keys: (keyof typeof data)[] = [
      'code', 'name', 'nameZh', 'description', 'learningObjectives',
      'level', 'duration', 'maxStudents', 'currency', 'status', 'slug', 'thumbnail',
    ];
    for (const key of keys) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (data.price !== undefined && data.price !== null) {
      updateData.price = new Decimal(data.price);
    }
    const updated = await this.prisma.course.update({
      where: { id },
      data: updateData as Record<string, unknown>,
    });
    return serializeCourse(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    const deleted = await this.prisma.course.delete({ where: { id } });
    return serializeCourse(deleted);
  }
}
