import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Download Vital30",
  description:
    "Vital30 will be available on iOS and Android. Join the early access list to be notified.",
  alternates: { canonical: "/download" },
};

export default function DownloadPage() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Get the Vital30 app
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
          Vital30 is heading to the App Store and Google Play. App store
          submission is in progress.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-6">
            <span className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Coming soon
            </span>
            <span className="text-lg font-semibold text-ink">App Store</span>
            <span className="text-xs text-ink-muted">iPhone &amp; iPad</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-6">
            <span className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Coming soon
            </span>
            <span className="text-lg font-semibold text-ink">Google Play</span>
            <span className="text-xs text-ink-muted">Android phones &amp; tablets</span>
          </div>
        </div>

        <p className="mt-12 text-sm text-ink-muted">
          Want to be notified at launch?{" "}
          <a
            href="mailto:hello@vital30.com?subject=Vital30%20launch%20notification"
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            Email us
          </a>{" "}
          and we&rsquo;ll let you know.
        </p>
      </Container>
    </section>
  );
}
