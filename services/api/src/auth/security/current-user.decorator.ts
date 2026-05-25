import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { UserRole } from '../domain/user-role.enum';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};

type RequestWithUser = Request & { user?: AuthenticatedUser };

/** Resolves the authenticated user attached by `JwtStrategy.validate`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw new Error(
        'CurrentUser decorator used on a route that was not authenticated. ' +
          'Add JwtAuthGuard or remove @Public().',
      );
    }
    return request.user;
  },
);
