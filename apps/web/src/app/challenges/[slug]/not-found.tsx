import Link from "next/link";
import { Container } from "@/components/Container";

export default function ChallengeNotFound() {
  return (
    <Container className="py-24 text-center">
      <h1 className="text-3xl font-bold text-ink sm:text-4xl">
        Challenge not found
      </h1>
      <p className="mt-3 text-base text-ink-muted">
        The challenge you&rsquo;re looking for may have been retired or the
        link is wrong.
      </p>
      <Link
        href="/challenges"
        className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        Browse all challenges →
      </Link>
    </Container>
  );
}
