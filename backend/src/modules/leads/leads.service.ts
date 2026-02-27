import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateLeadDto } from './dto/create-lead.dto';

const OWNER_EMAIL_KEY = 'LEAD_OWNER_EMAIL';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  async create(dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: {
        type: dto.type,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
        courseInterest: dto.courseInterest,
        timePreference: dto.timePreference,
        note: dto.note,
      },
    });

    const ownerEmail = this.config.get<string>(OWNER_EMAIL_KEY) || this.config.get<string>('SMTP_USER');
    if (ownerEmail && this.mail.isConfigured()) {
      try {
        const typeLabel = dto.type === 'TU_VAN' ? 'Tư vấn (Liên hệ)' : 'Đăng ký học thử';
        const subject = `[Website] ${typeLabel} - ${dto.name}`;
        const lines = [
          `Loại: ${typeLabel}`,
          `Họ tên: ${dto.name}`,
          `Email: ${dto.email}`,
          `Điện thoại: ${dto.phone}`,
          dto.message ? `Nội dung: ${dto.message}` : '',
          dto.courseInterest ? `Khóa quan tâm: ${dto.courseInterest}` : '',
          dto.timePreference ? `Khung giờ: ${dto.timePreference}` : '',
          dto.note ? `Ghi chú: ${dto.note}` : '',
          `Thời gian: ${lead.createdAt.toLocaleString('vi-VN')}`,
        ].filter(Boolean);
        const text = lines.join('\n');
        const result = await this.mail.send({
          to: ownerEmail,
          subject,
          text,
          html: '<pre style="font-family:sans-serif">' + text.replace(/\n/g, '<br>') + '</pre>',
          replyTo: dto.email,
        });
        if (!result.success) {
          console.warn('[Leads] Gửi email thất bại:', result.error);
        }
      } catch (err) {
        console.warn('[Leads] Lỗi khi gửi email (lead đã lưu):', err);
      }
    }

    return lead;
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead không tồn tại');
    return lead;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lead.delete({ where: { id } });
  }

  async findAll(params: { page?: number; limit?: number; type?: 'TU_VAN' | 'DANG_KY_HOC_THU' } = {}) {
    const { page = 1, limit = 20, type } = params;
    const where = type ? { type } : {};
    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { items, total, page, limit };
  }
}
