import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import { ROLES_KEY } from './roles.decorator';

/**
 * Role gate for the admin API. Runs AFTER the global Better Auth AuthGuard,
 * which has already authenticated the request and attached `request.session`
 * ({ session, user }). We read `session.user.role` (a Better Auth
 * additionalField) and reject anyone whose role isn't in the @Roles list.
 *
 * Routes/controllers with no @Roles metadata pass straight through, so this
 * guard is safe to register without affecting non-admin routes.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{
      session?: { user?: { role?: UserRole } };
    }>();
    const user = request?.session?.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }
    if (!user.role || !required.includes(user.role)) {
      throw new ForbiddenException('Admin access required.');
    }
    return true;
  }
}
