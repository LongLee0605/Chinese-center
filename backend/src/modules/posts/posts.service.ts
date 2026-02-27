import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PostStatus } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreatePostDto) {
    const publishedAt = dto.status === 'PUBLISHED' && dto.publishedAt
      ? new Date(dto.publishedAt)
      : dto.status === 'PUBLISHED'
        ? new Date()
        : null;
    return this.prisma.post.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        body: dto.body,
        coverImage: dto.coverImage,
        status: dto.status ?? PostStatus.DRAFT,
        publishedAt,
        authorId,
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async findAll(params: { status?: PostStatus; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findPublicList(page = 1, limit = 10) {
    return this.findAll({
      status: PostStatus.PUBLISHED,
      page,
      limit,
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');
    return post;
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug, status: PostStatus.PUBLISHED },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');
    return post;
  }

  async update(id: string, dto: UpdatePostDto) {
    await this.findOne(id);
    const publishedAt = dto.publishedAt != null ? new Date(dto.publishedAt) : undefined;
    return this.prisma.post.update({
      where: { id },
      data: {
        ...(dto.title != null && { title: dto.title }),
        ...(dto.slug != null && { slug: dto.slug }),
        ...(dto.excerpt != null && { excerpt: dto.excerpt }),
        ...(dto.body != null && { body: dto.body }),
        ...(dto.coverImage != null && { coverImage: dto.coverImage }),
        ...(dto.status != null && { status: dto.status }),
        ...(publishedAt !== undefined && { publishedAt }),
      },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.post.delete({ where: { id } });
  }
}
