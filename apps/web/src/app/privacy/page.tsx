import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { LegalArticle } from "@/components/LegalArticle";
import { loadDocAsHtml } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Vital30 collects, uses, and protects your data. We do not sell personal data.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const html = await loadDocAsHtml("privacy-policy.md");
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Privacy policy
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
