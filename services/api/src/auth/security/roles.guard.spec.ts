import { UserRole } from '../domain/user-role.enum';
import { hasRequiredRole } from './roles.guard';

describe('hasRequiredRole', () => {
  it('allows open routes when no role metadata is required', () => {
    expect(hasRequiredRole(undefined, [])).toBe(true);
  });

  it('allows users with a matching role', () => {
    expect(hasRequiredRole(UserRole.ADMIN, [UserRole.ADMIN])).toBe(true);
  });

  it('denies users without a matching role', () => {
    expect(hasRequiredRole(UserRole.USER, [UserRole.ADMIN])).toBe(false);
  });
});
