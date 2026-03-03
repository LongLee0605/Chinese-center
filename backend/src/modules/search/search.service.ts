import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UserRole } from '@prisma/client';

const DEFAULT_LIMIT = 6;

function searchTerm(term: string): string {
  return (term || '').trim().replace(/\s+/g, ' ').slice(0, 100);
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(
    q: string,
    opts: { limit?: number; requesterId?: string; requesterRole?: UserRole } = {},
  ) {
    const term = searchTerm(q);
    const limit = Math.min(Math.max(Number(opts.limit) || DEFAULT_LIMIT, 1), 20);
    const requesterId = opts.requesterId;
    const role = opts.requesterRole;

    if (!term || term.length < 2) {
      return {
        posts: [],
        courses: [],
        quizzes: [],
        leads: [],
        trialRegistrations: [],
        enrollmentRequests: [],
        users: [],
      };
    }

    const contains = { contains: term, mode: 'insensitive' as const };

    const userWhere =
      role === 'TEACHER'
        ? {
            OR: [
              ...(requesterId ? [{ id: requesterId }] : []),
              {
                role: 'STUDENT' as const,
                OR: [{ firstName: contains }, { lastName: contains }, { email: contains }],
              },
            ],
          }
        : { OR: [{ firstName: contains }, { lastName: contains }, { email: contains }] };

    const [posts, courses, quizzes, leads, trialRegistrations, enrollmentRequests, users] = await Promise.all([
      this.prisma.post.findMany({
        where: { OR: [{ title: contains }, { excerpt: contains }] },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, slug: true, status: true },
      }),
      this.prisma.course.findMany({
        where: { OR: [{ name: contains }, { code: contains }] },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, code: true, slug: true },
      }),
      this.prisma.quiz.findMany({
        where: { title: contains },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, slug: true },
      }),
      this.prisma.lead.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, name: true, email: true, createdAt: true },
      }),
      this.prisma.trialRegistration.findMany({
        where: {
          OR: [
            { fullName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { requestedAt: 'desc' },
        select: { id: true, fullName: true, email: true, status: true, course: { select: { name: true } } },
      }),
      this.prisma.courseEnrollmentRequest.findMany({
        where: {
          status: 'PENDING',
          OR: [
            { user: { email: contains } },
            { user: { firstName: contains } },
            { user: { lastName: contains } },
          ],
        },
        take: limit,
        orderBy: { requestedAt: 'desc' },
        select: {
          id: true,
          status: true,
          requestedAt: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          course: { select: { id: true, name: true, slug: true } },
        },
      }),
      role === 'SUPER_ADMIN' || role === 'TEACHER'
        ? this.prisma.user.findMany({
            where: userWhere,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          })
        : Promise.resolve([]),
    ]);

    return {
      posts: posts.map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status })),
      courses: courses.map((c) => ({ id: c.id, name: c.name, code: c.code, slug: c.slug })),
      quizzes: quizzes.map((q) => ({ id: q.id, title: q.title, slug: q.slug })),
      leads: leads.map((l) => ({ id: l.id, type: l.type, name: l.name, email: l.email, createdAt: l.createdAt })),
      trialRegistrations: trialRegistrations.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        email: t.email,
        status: t.status,
        courseName: t.course?.name,
      })),
      enrollmentRequests: enrollmentRequests.map((e) => ({
        id: e.id,
        status: e.status,
        requestedAt: e.requestedAt,
        userName: `${e.user.firstName} ${e.user.lastName}`.trim(),
        userEmail: e.user.email,
        courseId: e.course.id,
        courseName: e.course.name,
        courseSlug: e.course.slug,
      })),
      users: users.map((u) => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role })),
    };
  }
}
