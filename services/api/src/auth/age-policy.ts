/**
 * Vital30's minimum-age policy. Pure validator so it can be unit-tested
 * and reused by both the Better Auth signup hook and the profile editor.
 *
 * We store only the birth YEAR (data minimisation — see the User model),
 * so the gate is year-based: a user is allowed when
 * `currentYear - birthYear >= MIN_AGE_YEARS`. This is a deliberately
 * simple "neutral age screen"; it errs toward letting a 12-turning-13
 * through rather than blocking legitimate teens, which is the accepted
 * COPPA approach to age screening.
 *
 * 13 is the floor for COPPA (US). Several EU/EEA member states set the
 * GDPR "age of digital consent" higher (up to 16); per-state parental-
 * consent flows are a future enhancement — this gate is the baseline.
 *
 * Mirrored on the web (apps/web/src/lib/age-policy.ts). Keep both in sync.
 */

export const MIN_AGE_YEARS = 13;
export const EARLIEST_BIRTH_YEAR = 1900;

export type AgePolicyResult = { ok: true } | { ok: false; reason: string };

export function validateBirthYear(birthYear: unknown): AgePolicyResult {
  const year = typeof birthYear === 'number' ? birthYear : Number(birthYear);
  if (!Number.isFinite(year) || !Number.isInteger(year)) {
    return { ok: false, reason: 'Enter a valid birth year.' };
  }
  const now = new Date().getUTCFullYear();
  if (year < EARLIEST_BIRTH_YEAR || year > now) {
    return { ok: false, reason: 'Enter a valid birth year.' };
  }
  if (now - year < MIN_AGE_YEARS) {
    return {
      ok: false,
      reason: `You must be at least ${MIN_AGE_YEARS} years old to use Vital30.`,
    };
  }
  return { ok: true };
}
