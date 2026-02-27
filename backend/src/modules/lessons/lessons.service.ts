import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLessonDto) {
    return this.prisma.lesson.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        slug: dto.slug,
        orderIndex: dto.orderIndex ?? 0,
        content: dto.content,
        durationMinutes: dto.durationMinutes,
        type: dto.type ?? 'DOCUMENT',
        videoUrl: dto.videoUrl,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async findByCourse(courseId: string, publishedOnly = false) {
    const where: { courseId: string; isPublished?: boolean } = { courseId };
    if (publishedOnly) where.isPublished = true;
    return this.prisma.lesson.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { course: { select: { id: true, name: true, slug: true } } },
    });
    if (!lesson) throw new NotFoundException('Bài học không tồn tại');
    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto) {
    await this.findOne(id);
    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...(dto.title != null && { title: dto.title }),
        ...(dto.slug != null && { slug: dto.slug }),
        ...(dto.orderIndex != null && { orderIndex: dto.orderIndex }),
        ...(dto.content != null && { content: dto.content }),
        ...(dto.durationMinutes != null && { durationMinutes: dto.durationMinutes }),
        ...(dto.type != null && { type: dto.type }),
        ...(dto.videoUrl != null && { videoUrl: dto.videoUrl }),
        ...(dto.isPublished != null && { isPublished: dto.isPublished }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lesson.delete({ where: { id } });
  }

  async reorder(courseId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        this.prisma.lesson.updateMany({
          where: { id, courseId },
          data: { orderIndex: index },
        }),
      ),
    );
    return this.findByCourse(courseId);
  }
}
