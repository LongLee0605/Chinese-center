import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: UserRole } | undefined;
    if (!user?.role) return false;
    return ADMIN_ROLES.includes(user.role);
  }
}
