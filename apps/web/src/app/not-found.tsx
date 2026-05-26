import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
        404
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        Page not found
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been
        moved. Try one of these instead.
      </p>
      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <ButtonLink href="/" size="md">
          Go home
        </ButtonLink>
        <Link
          href="/challenges"
          className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-ink ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
        >
          Browse challenges
        </Link>
      </div>
    </Container>
  );
}
