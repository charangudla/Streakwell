import type { Challenge } from "./types";

export const FALLBACK_POPULAR_CHALLENGES: Pick<
  Challenge,
  "slug" | "title" | "shortDescription" | "difficulty" | "durationDays"
>[] = [
  {
    slug: "no-added-sugar-30",
    title: "30 Days No Added Sugar",
    shortDescription:
      "Cut added sugar from drinks, snacks, and meals to reset cravings.",
    difficulty: "MEDIUM",
    durationDays: 30,
  },
  {
    slug: "walking-30",
    title: "30 Days Walking",
    shortDescription:
      "A short daily walk to build a sustainable movement habit.",
    difficulty: "BEGINNER",
    durationDays: 30,
  },
  {
    slug: "no-soda-30",
    title: "30 Days No Soda",
    shortDescription:
      "Replace soda with water or unsweetened drinks for 30 days.",
    difficulty: "EASY",
    durationDays: 30,
  },
  {
    slug: "meditation-30",
    title: "30 Days Meditation",
    shortDescription:
      "Ten quiet minutes a day to lower stress and sharpen focus.",
    difficulty: "BEGINNER",
    durationDays: 30,
  },
  {
    slug: "sleep-before-1030-30",
    title: "30 Days Sleep Before 10:30 PM",
    shortDescription:
      "Set an earlier wind-down to protect deep sleep and energy.",
    difficulty: "EASY",
    durationDays: 30,
  },
];
