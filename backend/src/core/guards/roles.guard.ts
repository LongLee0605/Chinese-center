import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Mặc định: chỉ SUPER_ADMIN, TEACHER được vào CRM (khi route không gắn @Roles). ADMIN đã bỏ. */
const DEFAULT_CRM_ROLES: UserRole[] = ['SUPER_ADMIN', 'TEACHER'];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: UserRole } | undefined;
    if (!user?.role) return false;
    const allowedRoles = this.reflector.get<UserRole[] | undefined>(ROLES_KEY, context.getHandler());
    const roles = allowedRoles ?? DEFAULT_CRM_ROLES;
    return roles.includes(user.role);
  }
}
