import { UserRole } from '../domain/user-role.enum';

type ObjectAccessInput = {
  currentUserId: string;
  ownerUserId: string;
  currentUserRole?: UserRole;
};

export function canAccessOwnedResource({
  currentUserId,
  ownerUserId,
  currentUserRole,
}: ObjectAccessInput): boolean {
  if (
    currentUserRole === UserRole.ADMIN ||
    currentUserRole === UserRole.SUPER_ADMIN
  ) {
    return true;
  }

  return currentUserId === ownerUserId;
}
