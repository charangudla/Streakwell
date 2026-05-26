/**
 * Vital30's password policy. Pure validator so it can be unit-tested
 * without spinning up Better Auth.
 *
 * The same rules are mirrored in the Flutter register screen's
 * requirement pips. If you change them here, update
 * `apps/mobile/lib/features/auth/domain/login_validator.dart` too.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordPolicyResult = { ok: true } | { ok: false; reason: string };

/**
 * Returns `{ ok: true }` when the password satisfies every rule, or
 * `{ ok: false, reason }` with a human-friendly message the mobile can
 * render directly in a snackbar.
 */
export function validatePassword(password: unknown): PasswordPolicyResult {
  if (typeof password !== 'string') {
    return { ok: false, reason: 'Password is required.' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      reason: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      reason: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`,
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      ok: false,
      reason: 'Password must include a lowercase letter.',
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      ok: false,
      reason: 'Password must include an uppercase letter.',
    };
  }
  if (!/\d/.test(password)) {
    return {
      ok: false,
      reason: 'Password must include a number.',
    };
  }
  // Anything that isn't an ASCII letter/digit counts as "special" — covers
  // punctuation, symbols, and Unicode without being prescriptive.
  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      ok: false,
      reason: 'Password must include a symbol (e.g. ! @ # ? -).',
    };
  }
  return { ok: true };
}
