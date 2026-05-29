import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route (or whole controller) to the given user roles. Enforced
 * by RolesGuard, which reads the role off the Better Auth session.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Shorthand for the admin surface: ADMIN or SUPER_ADMIN only. */
export const AdminOnly = () => Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN);
