import type { Metadata } from "next";
import { BackLink } from "@/components/BackLink";
import { Container } from "@/components/Container";
import { LegalArticle } from "@/components/LegalArticle";
import { loadDocAsHtml } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The rules and responsibilities for using Vital30. Wellness only — not medical advice.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const html = await loadDocAsHtml("terms-of-service.md");
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <BackLink />
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Terms of service
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
