import { randomBytes } from 'node:crypto';

// Crockford-style base32 minus the visually ambiguous characters (0, O, 1, I, L, U).
// 28 letters; 8 chars => 28^8 ~= 3.78e11 possible codes.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateReferralCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
