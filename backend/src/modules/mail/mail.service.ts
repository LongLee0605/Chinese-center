import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaService } from '../../core/prisma/prisma.service';
import { wrapOutgoingEmail, textToSimpleHtml } from './templates/email-templates';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  /** Nếu false thì không ghi vào bảng sent_emails (dùng cho email tự động từ website, chỉ CRM gửi mới lưu). */
  saveToSent?: boolean;
}

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const portRaw = this.config.get<string>('SMTP_PORT');
    const port = (portRaw != null && portRaw !== '' ? Number(portRaw) : 587) || 587;
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS');
    const secure = this.config.get<string>('SMTP_SECURE') === 'true';
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number.isNaN(port) ? 587 : port,
        secure,
        auth: { user, pass },
      });
    }
  }

  async send(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; id?: string; error?: string }> {
    if (!this.transporter) {
      return { success: false, error: 'SMTP chưa cấu hình (SMTP_HOST, SMTP_USER, SMTP_PASS trong .env)' };
    }
    const from = this.config.get<string>('SMTP_FROM') || this.config.get<string>('SMTP_USER') || 'noreply@chinese-center.local';
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const saveToSent = options.saveToSent !== false;
    let html = options.html;
    if (saveToSent && (options.html || options.text)) {
      const bodyContent = options.html?.trim() || textToSimpleHtml(options.text ?? '');
      html = wrapOutgoingEmail(bodyContent, options.subject);
    } else if (!html && options.text) {
      html = '<p>' + String(options.text).replace(/\n/g, '<br>') + '</p>';
    }
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: options.subject,
        text: options.text,
        html,
        replyTo: options.replyTo,
      });
      let recordId: string | undefined;
      if (saveToSent) {
        const record = await this.prisma.sentEmail.create({
          data: {
            toAddresses: to,
            subject: options.subject,
            text: options.text ?? null,
            html: options.html ?? null,
          },
        });
        recordId = record.id;
      }
      return { success: true, messageId: info.messageId, id: recordId };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gửi mail thất bại' };
    }
  }

  async listSent(params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = params;
    const [items, total] = await Promise.all([
      this.prisma.sentEmail.findMany({
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.sentEmail.count(),
    ]);
    return { items, total, page, limit };
  }

  async getSent(id: string) {
    const item = await this.prisma.sentEmail.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Email không tồn tại');
    return item;
  }

  async deleteSent(id: string) {
    await this.getSent(id);
    return this.prisma.sentEmail.delete({ where: { id } });
  }

  isConfigured(): boolean {
    return this.transporter != null;
  }
}
