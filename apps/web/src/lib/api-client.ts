/**
 * Browser-side API client. Use from `'use client'` components.
 *
 * Server-side data fetching (SSG / ISR / server components) keeps using
 * `lib/api.ts` which talks directly to `NEXT_PUBLIC_API_BASE_URL` —
 * cookies don't matter there and the server can hit the API directly.
 *
 * The client wrapper:
 * - Routes through `/api/proxy/*` in dev (Next.js rewrite → API), so the
 *   browser sees a same-origin request and the session cookie is sent.
 * - Hits `NEXT_PUBLIC_API_BASE_URL` directly in prod, where the cookie is
 *   set with `Domain=.vital30.com` and naturally crosses the
 *   `vital30.com` ↔ `api.vital30.com` boundary.
 * - Always `credentials: "include"` so the Better Auth session cookie
 *   rides along.
 * - Throws `ApiClientError` on non-2xx so callers can catch + display.
 */

const isProd = process.env.NODE_ENV === "production";
const API_BASE = isProd
  ? (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.vital30.com")
  : "/api/proxy";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly bodyMessage: string,
    public readonly raw?: unknown,
  ) {
    super(bodyMessage || `HTTP ${status}`);
    this.name = "ApiClientError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiClient<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const raw = await res
    .json()
    .catch(() => (res.ok ? null : { message: res.statusText }));

  if (!res.ok) {
    const msg = extractMessage(raw);
    throw new ApiClientError(res.status, msg, raw);
  }
  return raw as T;
}

function extractMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Request failed.";
  const m = (body as { message?: unknown }).message;
  if (Array.isArray(m) && typeof m[0] === "string") return m[0];
  if (typeof m === "string") return m;
  return "Request failed.";
}
