/**
 * Phone validation — accept E.164 format only.
 *
 *   • starts with "+"
 *   • country code 1–3 digits, first digit 1–9
 *   • subscriber digits, total 7–15 digits inclusive after the "+"
 *
 * E.164 is the only international format that's actually parseable
 * server-side without a library. The signup form normalises whatever
 * the user types (strips spaces, dashes, parens, leading 00 → +)
 * before sending, so by the time the value hits this validator it
 * should already be canonicalised.
 *
 * We're NOT pulling in libphonenumber-js for v1 — adds ~150kb to the
 * web bundle for what is a presence check on signup. If we later
 * need per-country formatting + carrier checks for SMS OTP, that's
 * the time to add it.
 */

const E164_RE = /^\+[1-9]\d{6,14}$/;

export function validatePhoneFormat(phone: string): boolean {
  return E164_RE.test(phone);
}

/**
 * Lossy normalisation — strips spaces, dashes, parens, and turns a
 * leading "00" into "+". Doesn't add a country code: if the user
 * types a national number without one, the result still won't pass
 * E164_RE and we'll reject. The form already nudges with "+1…"
 * placeholder + a note.
 */
export function normalisePhone(input: string): string {
  let s = input.trim().replace(/[\s\-().]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  return s;
}
