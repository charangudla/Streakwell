import { API_BASE_URL } from "./constants";
import type { Category, Challenge } from "./types";

const REVALIDATE_SECONDS = 3600;

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: "application/json" },
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
  const all = await fetchChallenges();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await safeFetch<Category[]>("/categories");
  return data ?? [];
}
