/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import {
  Module,
  type DynamicModule,
  createParamDecorator,
} from '@nestjs/common';

// CJS-friendly stub of @thallesp/nestjs-better-auth used only by Jest.
// Tests that need to exercise actual Better Auth flows hit the real server
// (manual on-device verification or future Playwright/curl scripts);
// they don't go through this stub.

const noopDecorator = () => () => undefined;

export const AllowAnonymous = noopDecorator;
export const OptionalAuth = noopDecorator;
export const Public = noopDecorator;
export const Optional = noopDecorator;
export const Hook = noopDecorator;
export const DatabaseHook = noopDecorator;

export const Roles = (_roles: string[]) => () => undefined;
export const OrgRoles = (_roles: string[]) => () => undefined;
export const UserHasPermission = (_opts: unknown) => () => undefined;
export const MemberHasPermission = (_opts: unknown) => () => undefined;
export const BeforeHook = (_path?: string) => () => undefined;
export const AfterHook = (_path?: string) => () => undefined;
export const BeforeCreate = (_model: string) => () => undefined;
export const AfterCreate = (_model: string) => () => undefined;
export const BeforeUpdate = (_model: string) => () => undefined;
export const AfterUpdate = (_model: string) => () => undefined;

export const Session = createParamDecorator((_: unknown, _ctx: any) => ({
  user: { id: 'test-user', email: 'test@example.com', role: 'USER' },
  session: { id: 'test-session', token: 'test-token' },
}));

export type UserSession<_T = unknown> = {
  user: { id: string; email: string; role: string };
  session: { id: string; token: string };
};

@Module({})
export class AuthModule {
  static forRoot(_opts: unknown): DynamicModule {
    return { module: AuthModule };
  }
  static forRootAsync(_opts: unknown): DynamicModule {
    return { module: AuthModule };
  }
}

export class AuthService<_T = unknown> {
  get api(): Record<string, never> {
    return {};
  }
  get instance(): Record<string, never> {
    return {};
  }
}
