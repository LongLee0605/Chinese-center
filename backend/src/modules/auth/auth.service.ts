import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isTrial: true,
        trialExpiresAt: true,
      },
    });
    if (!user || !user.password) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    if (user.isTrial && user.trialExpiresAt && new Date() > user.trialExpiresAt) {
      throw new UnauthorizedException(
        'Tài khoản học thử đã hết hạn. Vui lòng liên hệ để mua khóa học hoặc gia hạn.',
      );
    }
    const { password: _, ...rest } = user;
    return rest;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
    });
    return user ?? null;
  }

  /** SUPER_ADMIN, TEACHER: được vào CRM (trừ quản lý user chỉ SUPER_ADMIN). */
  isStaffRole(role: UserRole): boolean {
    return role === 'SUPER_ADMIN' || role === 'TEACHER';
  }
}
