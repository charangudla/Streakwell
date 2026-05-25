import { UserRole } from '../domain/user-role.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
