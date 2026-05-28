/**
 * Username rules — Instagram-style handles.
 *
 *   • 3–30 characters
 *   • lowercase a–z, digits, period, underscore
 *   • must start with a letter or digit (no leading . or _)
 *   • must end with a letter or digit (no trailing . or _)
 *   • no consecutive `.` or `_` (e.g. "alice..b" invalid)
 *
 * Phone validation lives in phone-validation.ts. Keeping the two as
 * separate files because each grows over time (i18n, reserved-name
 * lists, etc.) and they have no overlap.
 *
 * Reserved usernames — keep a tiny blocklist for routes that we
 * already use as URLs (the future /[username] profile route would
 * collide). Names also rejected for moral/safety reasons should be
 * added here later via a dedicated moderation list, not here.
 */

const USERNAME_RE = /^(?!.*[._]{2})(?![._])(?!.*[._]$)[a-z0-9._]{3,30}$/;

const RESERVED = new Set([
  'admin',
  'api',
  'auth',
  'about',
  'challenges',
  'chat',
  'contact',
  'dashboard',
  'download',
  'faq',
  'favorites',
  'friends',
  'help',
  'invite',
  'invites',
  'login',
  'logout',
  'me',
  'my-challenges',
  'my-created-challenges',
  'notifications',
  'privacy',
  'profile',
  'register',
  'root',
  'settings',
  'signup',
  'support',
  'system',
  'terms',
  'users',
  'vital30',
]);

export type UsernameReason =
  | 'too_short'
  | 'too_long'
  | 'invalid_chars'
  | 'invalid_position' // leading/trailing . or _, or consecutive
  | 'reserved';

/**
 * Returns null if valid, otherwise a machine-readable reason code the
 * caller can surface ("This username is too short" etc).
 */
export function validateUsernameFormat(
  username: string,
): UsernameReason | null {
  if (username.length < 3) return 'too_short';
  if (username.length > 30) return 'too_long';
  if (RESERVED.has(username)) return 'reserved';
  if (!USERNAME_RE.test(username)) {
    // Drill into WHY it failed so the UI can be specific. The single
    // regex test is enough to reject — these subchecks just give a
    // better error message.
    if (/[^a-z0-9._]/.test(username)) return 'invalid_chars';
    return 'invalid_position';
  }
  return null;
}

const REASON_MESSAGES: Record<UsernameReason, string> = {
  too_short: 'Usernames must be at least 3 characters.',
  too_long: 'Usernames must be 30 characters or fewer.',
  invalid_chars:
    'Usernames can only contain lowercase letters, numbers, periods, and underscores.',
  invalid_position:
    "Usernames can't start or end with a period or underscore, or have two in a row.",
  reserved: 'That username is reserved. Pick another one.',
};

export function usernameReasonMessage(reason: UsernameReason): string {
  return REASON_MESSAGES[reason];
}
