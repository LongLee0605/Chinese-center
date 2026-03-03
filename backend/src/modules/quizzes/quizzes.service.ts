import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { canAccessWithGuest, type UserRoleOrGuest } from '../../core/visibility/visibility.util';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuizDto) {
    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        quizType: dto.quizType ?? 'MIXED',
        courseId: dto.courseId,
        lessonId: dto.lessonId,
        timeLimitMinutes: dto.timeLimitMinutes,
        passingScore: dto.passingScore ?? 60,
        isPublished: dto.isPublished ?? false,
        allowGuest: dto.allowGuest ?? false,
        visibleToRoles: Array.isArray(dto.visibleToRoles) ? dto.visibleToRoles : [],
      },
    });
  }

  async findAll(params: { page?: number; limit?: number; courseId?: string; lessonId?: string } = {}) {
    const { page = 1, limit = 20, courseId, lessonId } = params;
    const where: { courseId?: string; lessonId?: string } = {};
    if (courseId) where.courseId = courseId;
    if (lessonId) where.lessonId = lessonId;
    const [items, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        include: { _count: { select: { questions: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.quiz.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string, includeAnswers = false, userRole: UserRoleOrGuest = null) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          select: includeAnswers
            ? undefined
            : { id: true, type: true, questionText: true, options: true, orderIndex: true },
        },
        course: { select: { id: true, name: true } },
        lesson: { select: { id: true, title: true } },
      },
    });
    if (!quiz) throw new NotFoundException('Bài test không tồn tại');
    const allowed = canAccessWithGuest(quiz.allowGuest, quiz.visibleToRoles, userRole);
    if (!allowed) throw new ForbiddenException('Bạn không có quyền xem/làm bài test này.');
    if (!includeAnswers && quiz.questions) {
      (quiz as any).questions = (quiz.questions as any[]).map((q) => ({
        ...q,
        correctAnswer: undefined,
      }));
    }
    return quiz;
  }

  async findPublished(params: { page?: number; limit?: number } = {}, userRole: UserRoleOrGuest = null) {
    const { page = 1, limit = 50 } = params;
    const published = await this.prisma.quiz.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        quizType: true,
        timeLimitMinutes: true,
        passingScore: true,
        allowGuest: true,
        visibleToRoles: true,
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const allowed = published.filter((q) =>
      canAccessWithGuest(Boolean(q.allowGuest), q.visibleToRoles ?? [], userRole),
    );
    const total = allowed.length;
    const start = (page - 1) * limit;
    const paged = allowed.slice(start, start + limit);
    const items = paged.map(({ allowGuest, visibleToRoles, ...rest }) => rest);
    return { items, total, page, limit };
  }

  async findBySlug(slug: string, userRole: UserRoleOrGuest = null) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { slug, isPublished: true },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true, type: true, questionText: true, options: true, orderIndex: true },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Bài test không tồn tại');
    const allowed = canAccessWithGuest(quiz.allowGuest, quiz.visibleToRoles, userRole);
    if (!allowed) throw new ForbiddenException('Bạn không có quyền xem/làm bài test này.');
    return quiz;
  }

  async update(id: string, dto: UpdateQuizDto, userRole: UserRoleOrGuest) {
    await this.findOne(id, true, userRole);
    return this.prisma.quiz.update({
      where: { id },
      data: {
        ...(dto.title != null && { title: dto.title }),
        ...(dto.slug != null && { slug: dto.slug }),
        ...(dto.description != null && { description: dto.description }),
        ...(dto.quizType != null && { quizType: dto.quizType }),
        ...(dto.courseId != null && { courseId: dto.courseId }),
        ...(dto.lessonId != null && { lessonId: dto.lessonId }),
        ...(dto.timeLimitMinutes != null && { timeLimitMinutes: dto.timeLimitMinutes }),
        ...(dto.passingScore != null && { passingScore: dto.passingScore }),
        ...(dto.allowGuest !== undefined && { allowGuest: dto.allowGuest }),
        ...(dto.visibleToRoles !== undefined && { visibleToRoles: Array.isArray(dto.visibleToRoles) ? dto.visibleToRoles : [] }),
        ...(dto.isPublished != null && { isPublished: dto.isPublished }),
      },
    });
  }

  async remove(id: string, userRole: UserRoleOrGuest) {
    await this.findOne(id, true, userRole);
    return this.prisma.quiz.delete({ where: { id } });
  }

  // ----- Questions -----
  async addQuestion(quizId: string, dto: CreateQuestionDto, userRole: UserRoleOrGuest) {
    await this.findOne(quizId, true, userRole);
    const maxOrder = await this.prisma.quizQuestion
      .aggregate({ where: { quizId }, _max: { orderIndex: true } })
      .then((r) => (r._max.orderIndex ?? -1) + 1);
    return this.prisma.quizQuestion.create({
      data: {
        quizId,
        type: dto.type,
        questionText: dto.questionText,
        options: dto.options ?? undefined,
        correctAnswer: dto.correctAnswer,
        orderIndex: dto.orderIndex ?? maxOrder,
      },
    });
  }

  async updateQuestion(questionId: string, dto: Partial<CreateQuestionDto>) {
    const q = await this.prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Câu hỏi không tồn tại');
    return this.prisma.quizQuestion.update({
      where: { id: questionId },
      data: {
        ...(dto.type != null && { type: dto.type }),
        ...(dto.questionText != null && { questionText: dto.questionText }),
        ...(dto.options != null && { options: dto.options }),
        ...(dto.correctAnswer != null && { correctAnswer: dto.correctAnswer }),
        ...(dto.orderIndex != null && { orderIndex: dto.orderIndex }),
      },
    });
  }

  async removeQuestion(questionId: string) {
    const q = await this.prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Câu hỏi không tồn tại');
    return this.prisma.quizQuestion.delete({ where: { id: questionId } });
  }

  /** Website: thống kê lần làm bài của user đăng nhập */
  async getMyAttemptsSummary(quizId: string, userId: string | null) {
    if (!userId) return { attemptsCount: 0, latestScore: null, latestSubmittedAt: null };
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { submittedAt: 'desc' },
      take: 1,
      select: { score: true, submittedAt: true },
    });
    const count = await this.prisma.quizAttempt.count({ where: { quizId, userId } });
    const latest = attempts[0];
    return {
      attemptsCount: count,
      latestScore: latest?.score ?? null,
      latestSubmittedAt: latest?.submittedAt?.toISOString() ?? null,
    };
  }

  // ----- Attempt (website: nộp bài, guest hoặc user) -----
  async submitAttempt(
    quizId: string,
    answers: Record<string, string>,
    opts?: { userId?: string; guestName?: string; guestEmail?: string; userRole?: UserRoleOrGuest },
  ) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) throw new NotFoundException('Bài test không tồn tại');
    const allowed = canAccessWithGuest(quiz.allowGuest, quiz.visibleToRoles, opts?.userRole ?? null);
    if (!allowed) throw new ForbiddenException('Bạn không có quyền làm bài test này.');
    const mcTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE'];
    let mcCorrect = 0;
    let mcTotal = 0;
    for (const q of quiz.questions) {
      if (mcTypes.includes(q.type)) {
        mcTotal++;
        if (answers[q.id] === q.correctAnswer) mcCorrect++;
      }
    }
    const score = mcTotal > 0 ? Math.round((mcCorrect / mcTotal) * 100) : null;
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId: opts?.userId ?? null,
        guestName: opts?.guestName ?? null,
        guestEmail: opts?.guestEmail ?? null,
        quizId,
        score,
        answers: answers as any,
        submittedAt: new Date(),
      },
    });
    const hasEssay = quiz.questions.some((q) => q.type === 'ESSAY' || q.type === 'SHORT_ANSWER');
    const attemptNumber = opts?.userId
      ? await this.prisma.quizAttempt.count({ where: { quizId, userId: opts.userId } })
      : 1;
    return {
      attempt,
      score,
      mcCorrect,
      mcTotal,
      totalQuestions: quiz.questions.length,
      hasEssayPending: hasEssay,
      passed: score != null && score >= quiz.passingScore,
      attemptNumber,
    };
  }

  async listAttempts(quizId: string, params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = params;
    const [items, total] = await Promise.all([
      this.prisma.quizAttempt.findMany({
        where: { quizId },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.quizAttempt.count({ where: { quizId } }),
    ]);
    return { items, total, page, limit };
  }

  async getAttempt(attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: { include: { questions: { orderBy: { orderIndex: 'asc' } } } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!attempt) throw new NotFoundException('Bài nộp không tồn tại');
    return attempt;
  }

  async updateAttemptScore(attemptId: string, score: number) {
    const a = await this.prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!a) throw new NotFoundException('Bài nộp không tồn tại');
    return this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { score: Math.min(100, Math.max(0, score)) },
    });
  }

  async deleteAttempt(attemptId: string) {
    const a = await this.prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!a) throw new NotFoundException('Bài nộp không tồn tại');
    await this.prisma.quizAttempt.delete({ where: { id: attemptId } });
    return { success: true };
  }
}
