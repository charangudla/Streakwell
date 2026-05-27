import { randomBytes } from 'node:crypto';

// Same alphabet as referral codes (Crockford-ish base32, no ambiguous
// chars). 16 chars => 28^16 ≈ 7.2 × 10^22 combinations. Long enough to
// be unguessable in a URL and short enough to look reasonable.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateInviteToken(length = 16): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
