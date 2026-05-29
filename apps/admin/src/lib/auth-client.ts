import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth client for the admin dashboard.
 *
 * Mirrors `apps/web/src/lib/auth-client.ts` but for a Vite app (env vars
 * read off `import.meta.env`, no Next.js rewrites).
 *
 * - **Dev**: the admin runs on :5173 and talks cross-origin to the API on
 *   :3000. `VITE_API_BASE_URL` defaults to `http://localhost:3000`, so
 *   baseURL is `http://localhost:3000/api/auth`. The API trusts the
 *   admin origin (`trustedOrigins` includes `http://localhost:5173`) and
 *   `credentials: 'include'` carries the session cookie back and forth.
 * - **Prod**: baseURL is `https://api.challenge.charangudla.com/api/auth`.
 *   The API sets the session cookie with `Domain=.challenge.charangudla.com;
 *   SameSite=Lax` so `admin.challenge.charangudla.com` → `api.challenge.charangudla.com`
 *   shares the session automatically.
 */
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth`,
  fetchOptions: {
    credentials: 'include',
  },
});

export const { useSession, signIn, signOut, getSession } = authClient;

/**
 * The roles Vital30 recognises. `role` is a Better Auth additionalField
 * (typed loosely as `string` on the inferred session), so we narrow it
 * with this helper everywhere we gate on it.
 */
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * Extract the role off a Better Auth session user, defaulting to USER.
 *
 * `role` is a server-side additionalField; the client's inferred session
 * type doesn't surface it (the API doesn't share its `$Infer` type with
 * this app), so we read it defensively off an `unknown`-ish user.
 */
export function readRole(user: unknown): UserRole {
  const role =
    user && typeof user === 'object' && 'role' in user
      ? (user as { role?: unknown }).role
      : undefined;
  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'USER') {
    return role;
  }
  return 'USER';
}
