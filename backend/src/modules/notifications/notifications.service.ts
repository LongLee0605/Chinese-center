import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getCounts(requesterRole: string) {
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'TEACHER') {
      throw new ForbiddenException('Chỉ admin hoặc giảng viên mới xem được.');
    }
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [enrollmentRequestsPending, trialPending, leadsLast7Days] = await Promise.all([
      this.prisma.courseEnrollmentRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.trialRegistration.count({ where: { status: 'PENDING' } }),
      this.prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);
    return {
      enrollmentRequestsPending,
      trialPending,
      leadsLast7Days,
      total: enrollmentRequestsPending + trialPending + leadsLast7Days,
    };
  }
}
