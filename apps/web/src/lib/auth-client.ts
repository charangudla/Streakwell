import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for the public website.
 *
 * - **In dev**, baseURL points at `/api/auth` and Next.js rewrites proxy
 *   that to `http://localhost:3000/api/auth/*`. The browser sees a
 *   same-origin request → the session cookie is first-party, no CORS
 *   preflight, no SameSite=None song-and-dance.
 * - **In prod**, baseURL is `https://api.challenge.charangudla.com/api/auth` and the
 *   cookie is set with `Domain=.challenge.charangudla.com; SameSite=Lax` so both the
 *   website and the API share the session.
 *
 * `useSession`, `signIn`, `signUp`, `signOut`, `forgetPassword`,
 * `resetPassword`, and `getSession` are all exposed on the returned
 * client. See `better-auth/react` for the full surface.
 */
// Better Auth's client validates baseURL with `new URL(...)` at module
// evaluation — that happens on the server when a `'use client'` component
// imports this file, so the URL must be absolute even though the actual
// fetches happen in the browser.
//
// In dev we point at the website's own origin (:3001) so that Next.js
// rewrites in next.config.ts proxy `/api/auth/*` to the API on :3000.
// That makes Better Auth's session cookie a first-party cookie and
// avoids the SameSite=None requirement that comes with cross-origin.
//
// In prod we point at the API directly. The cookie is set with
// `Domain=.challenge.charangudla.com; SameSite=Lax` so it crosses subdomains naturally.
const isProd = process.env.NODE_ENV === "production";
const baseURL = isProd
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.challenge.charangudla.com"}/api/auth`
  : `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/api/auth`;

export const authClient = createAuthClient({
  baseURL,
  // `fetchOptions.credentials` defaults to "include" in Better Auth's
  // browser client; being explicit makes the intent obvious.
  fetchOptions: {
    credentials: "include",
  },
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  resetPassword,
  getSession,
} = authClient;
