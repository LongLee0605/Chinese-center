import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PostStatus } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { canAccessPost, type UserRoleOrGuest } from '../../core/visibility/visibility.util';

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
        allowGuest: dto.allowGuest !== false,
        visibleToRoles: Array.isArray(dto.visibleToRoles) ? dto.visibleToRoles : [],
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

  async findPublicList(page = 1, limit = 10, userRole: UserRoleOrGuest = null) {
    try {
      const published = await this.prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      const items = published.filter((p) => {
        const roles = Array.isArray(p.visibleToRoles) ? p.visibleToRoles : [];
        const allowGuest = (p as { allowGuest?: boolean }).allowGuest;
        return canAccessPost(roles, userRole, allowGuest);
      });
      const total = items.length;
      const start = (page - 1) * limit;
      const paged = items.slice(start, start + limit);
      return { items: paged, total, page, limit };
    } catch (err) {
      console.error('[PostsService.findPublicList]', err);
      throw err;
    }
  }

  async findOne(id: string, userRole: UserRoleOrGuest = null) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');
    const allowGuest = (post as { allowGuest?: boolean }).allowGuest;
    const allowed = canAccessPost(post.visibleToRoles ?? [], userRole, allowGuest);
    if (!allowed) throw new ForbiddenException('Bạn không có quyền xem bài viết này.');
    return post;
  }

  async findBySlug(slug: string, userRole: UserRoleOrGuest = null) {
    const post = await this.prisma.post.findUnique({
      where: { slug, status: PostStatus.PUBLISHED },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');
    const allowGuest = (post as { allowGuest?: boolean }).allowGuest;
    const allowed = canAccessPost(post.visibleToRoles ?? [], userRole, allowGuest);
    if (!allowed) throw new ForbiddenException('Bạn không có quyền xem bài viết này.');
    return post;
  }

  async update(id: string, dto: UpdatePostDto, userRole: UserRoleOrGuest) {
    await this.findOne(id, userRole);
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
        ...(dto.allowGuest !== undefined && { allowGuest: dto.allowGuest }),
        ...(dto.visibleToRoles !== undefined && { visibleToRoles: Array.isArray(dto.visibleToRoles) ? dto.visibleToRoles : [] }),
      },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async remove(id: string, userRole: UserRoleOrGuest) {
    await this.findOne(id, userRole);
    return this.prisma.post.delete({ where: { id } });
  }
}
