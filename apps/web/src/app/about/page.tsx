import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "About",
  description:
    "Vital30 helps you build better habits through simple, recovery-friendly 30-day wellness challenges.",
  alternates: { canonical: "/about" },
};

const PILLARS = [
  {
    title: "Small, focused changes",
    body: "One challenge at a time. Thirty days. A daily task simple enough to do on your worst day.",
  },
  {
    title: "Recovery-friendly",
    body: "Missing a day breaks your current streak but never erases your active days. Progress > perfection.",
  },
  {
    title: "Wellness, not medicine",
    body: "Vital30 is general wellness guidance. It does not diagnose, treat, or replace professional care.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 via-white to-white py-16 sm:py-20">
        <Container className="max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            About Vital30
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
            30 days. Better habits. Healthier you. Vital30 is a simple,
            recovery-friendly wellness challenge platform.
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h2 className="text-lg font-semibold text-ink">
                  {pillar.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>

          <div className="prose prose-slate mt-16 max-w-none">
            <h2 className="text-2xl font-bold text-ink">Why 30 days</h2>
            <p className="text-base leading-relaxed text-ink-muted">
              Thirty days is long enough for a habit to start feeling normal,
              short enough that you can see the finish line on day one. It is
              not magic — habit research suggests the actual window varies
              widely — but it is a useful structure to commit to.
            </p>
            <h2 className="mt-10 text-2xl font-bold text-ink">
              Who Vital30 is for
            </h2>
            <p className="text-base leading-relaxed text-ink-muted">
              Adults, students, and families looking to build better daily
              habits in diet, movement, sleep, mental wellness, or to reduce a
              specific bad habit. If you have a medical condition or are
              recovering from one, please consult your doctor before joining
              any challenge.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
