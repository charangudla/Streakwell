export type ChallengeDifficulty = "BEGINNER" | "EASY" | "MEDIUM" | "HARD";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
};

export type Challenge = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  durationDays: number;
  difficulty: ChallengeDifficulty;
  dailyTask: string;
  benefits: string[];
  safetyNote: string | null;
  isPopular: boolean;
  isRecommended: boolean;
  categoryId: string;
  category?: Pick<Category, "id" | "name" | "slug">;
};
