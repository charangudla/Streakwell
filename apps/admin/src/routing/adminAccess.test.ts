import { describe, expect, it } from 'vitest';
import { canAccessAdminRoute } from './adminAccess';

describe('canAccessAdminRoute', () => {
  it('allows ADMIN and SUPER_ADMIN roles', () => {
    expect(canAccessAdminRoute('ADMIN')).toBe(true);
    expect(canAccessAdminRoute('SUPER_ADMIN')).toBe(true);
  });

  it('denies users and anonymous visitors', () => {
    expect(canAccessAdminRoute('USER')).toBe(false);
    expect(canAccessAdminRoute(null)).toBe(false);
  });
});
