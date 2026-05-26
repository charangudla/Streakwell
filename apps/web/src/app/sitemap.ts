import type { MetadataRoute } from "next";
import { fetchChallenges } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";

const STATIC_PATHS = [
  "",
  "/challenges",
  "/about",
  "/download",
  "/contact",
  "/privacy",
  "/terms",
  "/health-disclaimer",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const challenges = await fetchChallenges();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1.0 : 0.7,
  }));

  const challengeEntries: MetadataRoute.Sitemap = challenges.map(
    (challenge) => ({
      url: `${SITE_URL}/challenges/${challenge.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }),
  );

  return [...staticEntries, ...challengeEntries];
}
