import { API_BASE_URL } from "./constants";
import type { Category, Challenge } from "./types";

const REVALIDATE_SECONDS = 3600;

// This module is server-only (SSG / ISR / server components). In production the
// web container must reach the API over the INTERNAL Docker network
// (`http://api:3000`) instead of the public hostname: a container hitting its
// own host's public IP triggers NAT hairpin, which on a standard Docker bridge
// blackholes the connection. A blackholed request hangs the server render
// indefinitely → nginx returns 502. So we (a) prefer an internal base URL when
// provided, falling back to the public one for local dev, and (b) hard-cap
// every request with a timeout so a render can NEVER hang — on timeout it falls
// back to cached/empty data and the page still returns 200.
const SERVER_API_BASE_URL = process.env.API_INTERNAL_URL ?? API_BASE_URL;
const FETCH_TIMEOUT_MS = 4000;

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchChallenges(): Promise<Challenge[]> {
  const data = await safeFetch<Challenge[]>("/challenges");
  return data ?? [];
}

export async function fetchChallengeBySlug(
  slug: string,
): Promise<Challenge | null> {
  return safeFetch<Challenge>(
    `/challenges/slug/${encodeURIComponent(slug)}`,
  );
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await safeFetch<Category[]>("/categories");
  return data ?? [];
}

export async function fetchCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const all = await fetchCategories();
  return all.find((c) => c.slug === slug) ?? null;
}
