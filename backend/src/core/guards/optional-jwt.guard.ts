import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Guard dùng cho route public: có JWT thì set req.user, không có hoặc invalid thì req.user = null.
 * Luôn cho qua (canActivate = true) để controller/service tự kiểm tra quyền theo role.
 * Không bao giờ throw — mọi lỗi (thiếu/invalid token) đều cho qua với user = null.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const result = super.canActivate(context);
      if (typeof result === 'boolean') return result;
      return (result as Observable<boolean>).pipe(
        catchError(() => of(true)),
        map((v) => v),
      );
    } catch {
      return true;
    }
  }

  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return user ?? (null as TUser);
  }
}
