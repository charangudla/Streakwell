import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChallengeCard } from "@/components/ChallengeCard";

describe("ChallengeCard", () => {
  it("renders the challenge title, description, duration, and difficulty", () => {
    render(
      <ChallengeCard
        challenge={{
          slug: "walking-30",
          title: "30 Days Walking",
          shortDescription: "A short daily walk to build a habit.",
          difficulty: "BEGINNER",
          durationDays: 30,
        }}
      />,
    );

    expect(screen.getByText("30 Days Walking")).toBeInTheDocument();
    expect(
      screen.getByText("A short daily walk to build a habit."),
    ).toBeInTheDocument();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(screen.getByText("30 days")).toBeInTheDocument();
  });

  it("links to /challenges/[slug]", () => {
    render(
      <ChallengeCard
        challenge={{
          slug: "no-soda-30",
          title: "30 Days No Soda",
          shortDescription: "Cut soda for 30 days.",
          difficulty: "EASY",
          durationDays: 30,
        }}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/challenges/no-soda-30");
  });

  it("uses the rose tone class for HARD difficulty", () => {
    render(
      <ChallengeCard
        challenge={{
          slug: "h",
          title: "A hard one",
          shortDescription: "x",
          difficulty: "HARD",
          durationDays: 30,
        }}
      />,
    );
    expect(screen.getByText("Hard")).toHaveClass("text-rose-700");
  });
});
