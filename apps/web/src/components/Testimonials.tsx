import { Container } from "./Container";

const TESTIMONIALS = [
  {
    quote:
      "I tried five habit apps before this. The recovery-friendly streaks finally got me past day 9.",
    author: "Priya",
    role: "30 Days Walking",
  },
  {
    quote:
      "Simple enough that I actually open it. My kids check in with me on the family wellness challenge every night.",
    author: "Marcus",
    role: "30 Days Family Walk",
  },
  {
    quote:
      "Quit my afternoon soda habit in three weeks. The daily question is what keeps it honest.",
    author: "Sara",
    role: "30 Days No Soda",
  },
];

export function Testimonials() {
  return (
    <section className="bg-surface-soft py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            What people are saying
          </h2>
          <p className="mt-4 text-base text-ink-muted sm:text-lg">
            Early users joining their first 30 days.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.author}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
            >
              <svg
                viewBox="0 0 32 32"
                fill="currentColor"
                className="h-8 w-8 text-brand-400"
                aria-hidden="true"
              >
                <path d="M9 8c-3.3 0-6 2.7-6 6v10h10V14h-6c0-2.2 1.8-4 4-4V8H9zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-2.2 1.8-4 4-4V8h-2z" />
              </svg>
              <blockquote className="mt-4 flex-1 text-base leading-relaxed text-ink">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-ink">{t.author}</p>
                <p className="text-xs text-ink-muted">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-ink-muted">
          Composite illustrations from beta feedback. Real testimonials with
          consent at launch.
        </p>
      </Container>
    </section>
  );
}
