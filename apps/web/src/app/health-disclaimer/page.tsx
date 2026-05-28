import type { Metadata } from "next";
import { BackLink } from "@/components/BackLink";
import { Container } from "@/components/Container";
import { LegalArticle } from "@/components/LegalArticle";
import { loadDocAsHtml } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Health disclaimer",
  description:
    "Vital30 is general wellness guidance — not medical advice. Consult a healthcare professional before changes to diet, exercise, or substance use.",
  alternates: { canonical: "/health-disclaimer" },
};

export default async function HealthDisclaimerPage() {
  const html = await loadDocAsHtml("health-disclaimer.md");
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <BackLink />
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Health &amp; medical disclaimer
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          This is a working template. Attorney review is recommended before
          public launch.
        </p>
        <div className="mt-10">
          <LegalArticle html={html} />
        </div>
      </Container>
    </section>
  );
}
