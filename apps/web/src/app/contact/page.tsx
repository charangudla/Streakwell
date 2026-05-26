import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Container } from "@/components/Container";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Vital30 team about the app, partnerships, or feedback.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Contact Vital30
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
          We&rsquo;d love to hear from you — feedback, partnership ideas, or
          questions about a challenge.
        </p>

        <div className="mt-10">
          <ContactForm />
        </div>

        <div className="mt-12 space-y-4 rounded-2xl border border-slate-200 bg-surface-soft p-6 sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Or email us directly
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-1 inline-block text-lg font-semibold text-brand-700 hover:text-brand-800"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Data deletion requests
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Data%20Deletion%20Request`}
              className="mt-1 inline-block text-lg font-semibold text-brand-700 hover:text-brand-800"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-1 text-sm text-ink-muted">
              Subject line: &ldquo;Data Deletion Request&rdquo;.
            </p>
          </div>
        </div>

        <p className="mt-10 text-sm text-ink-muted">
          For medical emergencies, do not contact Vital30 — call your local
          emergency services (911 in the US, 112 in Europe, 999 in the UK).
        </p>
      </Container>
    </section>
  );
}
