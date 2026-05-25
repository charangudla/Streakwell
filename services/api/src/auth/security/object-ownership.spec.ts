import { UserRole } from '../domain/user-role.enum';
import { canAccessOwnedResource } from './object-ownership';

describe('canAccessOwnedResource', () => {
  it('allows users to access their own resource', () => {
    expect(
      canAccessOwnedResource({
        currentUserId: 'user-1',
        ownerUserId: 'user-1',
        currentUserRole: UserRole.USER,
      }),
    ).toBe(true);
  });

  it('denies users from accessing another user resource', () => {
    expect(
      canAccessOwnedResource({
        currentUserId: 'user-1',
        ownerUserId: 'user-2',
        currentUserRole: UserRole.USER,
      }),
    ).toBe(false);
  });

  it('allows admins to access owned resources for support workflows', () => {
    expect(
      canAccessOwnedResource({
        currentUserId: 'admin-1',
        ownerUserId: 'user-2',
        currentUserRole: UserRole.ADMIN,
      }),
    ).toBe(true);
  });
});
