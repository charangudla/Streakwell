import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCategories,
  fetchCategoryBySlug,
  fetchChallengeBySlug,
  fetchChallenges,
} from "@/lib/api";

const originalFetch = global.fetch;

describe("lib/api", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("fetchChallenges returns the parsed list on 200", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          title: "T",
          slug: "t",
          shortDescription: "s",
          description: "d",
          durationDays: 30,
          difficulty: "EASY",
          dailyTask: "t",
          benefits: ["a"],
          safetyNote: null,
          isPopular: false,
          isRecommended: false,
          categoryId: "c",
        },
      ],
    });
    const out = await fetchChallenges();
    expect(out).toHaveLength(1);
    expect(out[0].slug).toBe("t");
  });

  it("fetchChallenges returns [] when the API errors", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });
    expect(await fetchChallenges()).toEqual([]);
  });

  it("fetchChallenges returns [] when fetch throws", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("network down"),
    );
    expect(await fetchChallenges()).toEqual([]);
  });

  it("fetchChallengeBySlug returns the parsed challenge on 200", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        title: "X",
        slug: "x",
        shortDescription: "s",
        description: "d",
        durationDays: 30,
        difficulty: "EASY",
        dailyTask: "t",
        benefits: ["a"],
        safetyNote: null,
        isPopular: false,
        isRecommended: false,
        categoryId: "c",
      }),
    });
    const out = await fetchChallengeBySlug("x");
    expect(out?.slug).toBe("x");
  });

  it("fetchChallengeBySlug returns null on 404", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });
    expect(await fetchChallengeBySlug("missing")).toBeNull();
  });

  it("fetchCategoryBySlug filters from the categories list", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "1", name: "Diet", slug: "diet", description: null, iconName: null },
        { id: "2", name: "Sleep", slug: "sleep", description: null, iconName: null },
      ],
    });
    const cat = await fetchCategoryBySlug("sleep");
    expect(cat?.id).toBe("2");
  });

  it("fetchCategories returns [] on error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });
    expect(await fetchCategories()).toEqual([]);
  });
});
