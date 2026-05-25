import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '../domain/user-role.enum';
import { ROLES_KEY } from './roles.decorator';

type AuthenticatedRequest = Request & {
  user?: {
    role?: UserRole;
  };
};

export function hasRequiredRole(
  userRole: UserRole | undefined,
  requiredRoles: UserRole[],
): boolean {
  if (requiredRoles.length === 0) {
    return true;
  }

  if (!userRole) {
    return false;
  }

  return requiredRoles.includes(userRole);
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return hasRequiredRole(request.user?.role, requiredRoles);
  }
}
