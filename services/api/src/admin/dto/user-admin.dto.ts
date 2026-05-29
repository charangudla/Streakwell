import { IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class SetActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

export class SetRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
