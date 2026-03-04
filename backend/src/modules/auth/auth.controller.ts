import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private jwt: JwtService,
    private users: UsersService,
  ) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  login(@Request() req: { user: { id: string; email: string; firstName: string; lastName: string; role: string } }) {
    const payload = { sub: req.user.id, email: req.user.email, role: req.user.role };
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
      },
    };
  }

  /** Trả về full profile (đồng bộ với GET /users/me) để website/CRM có đủ thông tin. */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Request() req: { user: { sub: string; role: string } }) {
    return this.users.findOneWithDetail(req.user.sub, req.user.sub, (req.user.role as UserRole) ?? 'STUDENT');
  }
}
