/**
 * Minimum-age policy — mirror of services/api/src/auth/age-policy.ts.
 * Keep the two in sync. Used for instant client-side feedback at signup;
 * the server enforces the same rule authoritatively.
 *
 * We collect only the birth YEAR (data minimisation), so the gate is
 * year-based: allowed when `currentYear - birthYear >= MIN_AGE_YEARS`.
 */

export const MIN_AGE_YEARS = 13;
export const EARLIEST_BIRTH_YEAR = 1900;

export type AgePolicyResult = { ok: true } | { ok: false; reason: string };

export function validateBirthYear(birthYear: number): AgePolicyResult {
  if (!Number.isFinite(birthYear) || !Number.isInteger(birthYear)) {
    return { ok: false, reason: "Enter a valid birth year." };
  }
  const now = new Date().getFullYear();
  if (birthYear < EARLIEST_BIRTH_YEAR || birthYear > now) {
    return { ok: false, reason: "Enter a valid birth year." };
  }
  if (now - birthYear < MIN_AGE_YEARS) {
    return {
      ok: false,
      reason: `You must be at least ${MIN_AGE_YEARS} years old to use Vital30.`,
    };
  }
  return { ok: true };
}
