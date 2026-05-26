import type { ConfigService } from '@nestjs/config';
import type { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { bearer } from 'better-auth/plugins';

import type { AuditLogService } from '../audit/audit-log.service';
import type { EmailService } from '../email/email.service';
import { generateReferralCode } from '../referrals/referral-code';
import { validatePassword } from './password-policy';

/**
 * Builds the Better Auth instance.
 *
 * Mounted under `/api/auth/*` by the @thallesp/nestjs-better-auth adapter
 * — every sign-in / sign-up / reset / verify / update-user / delete-user
 * route lives there. Vital30's own controllers stay JWT-style protected
 * via the adapter's global AuthGuard.
 *
 * We deliberately use:
 * - The shared `PrismaClient` from `PrismaService` (one connection pool).
 * - `requireEmailVerification: false` — the verification email still goes
 *   out, but we don't block sign-in. Lower friction for the MVP; tighten
 *   later if abuse becomes a problem.
 * - `bearer()` plugin — mobile sends `Authorization: Bearer <token>` and
 *   gets the token back in the `set-auth-token` response header on sign-in.
 * - Per-route rate limits on sign-in / password-reset / verification —
 *   defends against brute force without throttling normal browsing.
 */
export function createAuth(
  prisma: PrismaClient,
  config: ConfigService,
  email: EmailService,
  audit: AuditLogService,
) {
  const secret = config.get<string>('BETTER_AUTH_SECRET');
  if (!secret) {
    throw new Error(
      'BETTER_AUTH_SECRET must be set in the environment (>= 32 chars).',
    );
  }
  const baseURL =
    config.get<string>('BETTER_AUTH_URL') ?? 'http://localhost:3000';

  return betterAuth({
    secret,
    baseURL,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),

    trustedOrigins: [
      config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173',
    ],

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, url, token }) => {
        await audit.record({
          userId: user.id,
          action: 'auth.password_reset.requested',
          metadata: { email: user.email },
        });
        await email.send({
          to: user.email,
          subject: 'Reset your Vital30 password',
          text: [
            `Hi${user.name ? ` ${user.name}` : ''},`,
            '',
            'Use this code to reset your password:',
            '',
            `  ${token}`,
            '',
            `Or open this link: ${url}`,
            '',
            "This code expires in 15 minutes. If you didn't request this, ignore this email.",
            '',
            '— Vital30',
          ].join('\n'),
        });
      },
      onPasswordReset: async ({ user }) => {
        await audit.record({
          userId: user.id,
          action: 'auth.password_reset.completed',
          metadata: { email: user.email },
        });
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await email.send({
          to: user.email,
          subject: 'Verify your Vital30 email',
          text: [
            `Hi${user.name ? ` ${user.name}` : ''},`,
            '',
            'Tap the link below to verify your email:',
            '',
            url,
            '',
            'You can still use the app while your email is unverified, ' +
              'but verifying lets us help you recover your account if you ' +
              'ever lose your password.',
            '',
            '— Vital30',
          ].join('\n'),
        });
      },
    },

    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/request-password-reset': { window: 60, max: 3 },
        '/send-verification-email': { window: 300, max: 3 },
      },
    },

    user: {
      // Surface our UserRole extension to the session so existing
      // RolesGuard / @CurrentUser consumers keep working.
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'USER',
          input: false,
        },
      },
      // App Store guideline 5.1.1(v): users must be able to delete their
      // account from inside the app. Better Auth gates the route off by
      // default — opt in here. The mobile shows a destructive AlertDialog
      // before calling this; combined with the session-bearer requirement,
      // that's the same level of intent-proof Apple's review expects.
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          // Record before the cascade fires — once the User row is gone,
          // the audit row's userId becomes null (onDelete: SetNull) but
          // the email + action survive for compliance review.
          await audit.record({
            userId: user.id,
            action: 'auth.account_deleted',
            metadata: { email: user.email },
          });
        },
      },
    },

    advanced: {
      // Let Postgres generate UUIDs via Prisma's @default(uuid()). Better
      // Auth's default IDs (Nanoid-like) fail @db.Uuid validation.
      database: {
        generateId: false,
      },
    },

    // Fire-and-forget audit-log entries for the security-relevant lifecycle
    // events. We don't await these from the request handler because Better
    // Auth's databaseHooks run inside the same transaction — but our
    // AuditLogService swallows errors internally so a bad write can't fail
    // the user-facing request anyway.
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            // Auto-assign a referral code on signup. P2002 = unique conflict;
            // retry with a fresh code. After 6 attempts the space is so
            // saturated something is wrong — bail rather than block signup.
            for (let attempt = 0; attempt < 6; attempt += 1) {
              const code = generateReferralCode();
              try {
                await prisma.user.update({
                  where: { id: user.id },
                  data: { referralCode: code },
                });
                break;
              } catch (err: unknown) {
                const code = (err as { code?: string }).code;
                if (code !== 'P2002') {
                  // eslint-disable-next-line no-console
                  console.error('Failed to assign referral code', err);
                  break;
                }
              }
            }
            await audit.record({
              userId: user.id,
              action: 'auth.signup',
              metadata: { email: user.email },
            });
          },
        },
      },
      session: {
        create: {
          after: async (session) => {
            await audit.record({
              userId: session.userId,
              action: 'auth.login',
              ipAddress: session.ipAddress ?? null,
              userAgent: session.userAgent ?? null,
            });
          },
        },
      },
    },

    // Enforce Vital30's password policy (upper + lower + number + symbol)
    // before Better Auth ever hashes the credential. Runs on /sign-up/email
    // and on /reset-password — the two paths that accept a new password.
    hooks: {
      // createAuthMiddleware requires an async handler signature even when
      // the body has no actual awaits — validatePassword is sync. Disable
      // the eslint complaint locally.
      // eslint-disable-next-line @typescript-eslint/require-await
      before: createAuthMiddleware(async (ctx) => {
        const path = ctx.path;
        if (path === '/sign-up/email') {
          const body = ctx.body as { password?: unknown } | undefined;
          const result = validatePassword(body?.password);
          if (!result.ok) {
            throw new APIError('BAD_REQUEST', { message: result.reason });
          }
        }
        if (path === '/reset-password') {
          const body = ctx.body as { newPassword?: unknown } | undefined;
          const result = validatePassword(body?.newPassword);
          if (!result.ok) {
            throw new APIError('BAD_REQUEST', { message: result.reason });
          }
        }
      }),
    },

    plugins: [bearer()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
