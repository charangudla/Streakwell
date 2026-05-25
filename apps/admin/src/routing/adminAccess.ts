export type AdminRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export function canAccessAdminRoute(role: AdminRole | null | undefined) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}
