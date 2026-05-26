import type { ConfigService } from '@nestjs/config';
import type { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins';

import type { EmailService } from '../email/email.service';

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
      },
    },

    advanced: {
      // Let Postgres generate UUIDs via Prisma's @default(uuid()). Better
      // Auth's default IDs (Nanoid-like) fail @db.Uuid validation.
      database: {
        generateId: false,
      },
    },

    plugins: [bearer()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
