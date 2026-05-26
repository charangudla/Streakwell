import Link from "next/link";
import { FavoriteHeart } from "./FavoriteHeart";
import type { Challenge } from "@/lib/types";

const DIFFICULTY_LABEL: Record<Challenge["difficulty"], string> = {
  BEGINNER: "Beginner",
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

const DIFFICULTY_TONE: Record<Challenge["difficulty"], string> = {
  BEGINNER: "bg-brand-50 text-brand-700",
  EASY: "bg-brand-50 text-brand-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HARD: "bg-rose-50 text-rose-700",
};

type ChallengeCardProps = {
  challenge: Pick<
    Challenge,
    "slug" | "title" | "shortDescription" | "difficulty" | "durationDays"
  > & { id?: string };
  showFavorite?: boolean;
};

export function ChallengeCard({
  challenge,
  showFavorite = true,
}: ChallengeCardProps) {
  return (
    <div className="relative h-full">
      <Link
        href={`/challenges/${challenge.slug}`}
        className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        <div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${DIFFICULTY_TONE[challenge.difficulty]}`}
          >
            {DIFFICULTY_LABEL[challenge.difficulty]}
          </span>
          <h3 className="mt-4 max-w-[80%] text-lg font-semibold text-ink group-hover:text-brand-700">
            {challenge.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {challenge.shortDescription}
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between text-sm font-medium text-ink-muted">
          <span>{challenge.durationDays} days</span>
          <span className="text-brand-600 transition-transform group-hover:translate-x-0.5">
            Read more →
          </span>
        </div>
      </Link>
      {showFavorite && challenge.id ? (
        <div className="absolute right-3 top-3">
          <FavoriteHeart challengeId={challenge.id} size={36} />
        </div>
      ) : null}
    </div>
  );
}
