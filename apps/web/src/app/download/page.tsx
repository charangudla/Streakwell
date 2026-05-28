import type { Metadata } from "next";
import { Container } from "@/components/Container";
import {
  CheckinScreenshot,
  HomeScreenshot,
  ProgressScreenshot,
} from "@/components/AppScreenshot";

export const metadata: Metadata = {
  title: "Download Vital30",
  description:
    "Vital30 is heading to the App Store and Google Play. Preview the app, then sign up to be notified at launch.",
  alternates: { canonical: "/download" },
};

export default function DownloadPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 via-white to-white py-16 sm:py-20">
        <Container className="max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Get the Vital30 app
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
            Vital30 is heading to the App Store and Google Play. Here&rsquo;s
            what you&rsquo;ll get when it lands.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Coming soon
              </span>
              <span className="text-lg font-semibold text-ink">App Store</span>
              <span className="text-xs text-ink-muted">iPhone &amp; iPad</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Coming soon
              </span>
              <span className="text-lg font-semibold text-ink">Google Play</span>
              <span className="text-xs text-ink-muted">
                Android phones &amp; tablets
              </span>
            </div>
          </div>

          <p className="mt-8 text-sm text-ink-muted">
            Want to be notified at launch?{" "}
            <a
              href="mailto:hello@challenge.charangudla.com?subject=Vital30%20launch%20notification"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Email us
            </a>{" "}
            and we&rsquo;ll let you know.
          </p>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              A preview of what&rsquo;s inside
            </h2>
            <p className="mt-4 text-base text-ink-muted sm:text-lg">
              Clean, small, and consistent. The whole loop is built around one
              question: did you do today&rsquo;s task?
            </p>
          </div>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <HomeScreenshot />
            <CheckinScreenshot />
            <ProgressScreenshot />
          </div>
        </Container>
      </section>

      <section className="bg-surface-soft py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Privacy &amp; safety, up front
          </h2>
          <ul className="mt-6 space-y-3 text-base text-ink-muted">
            <li className="flex items-start gap-3">
              <span className="mt-1 grid h-5 w-5 flex-none place-items-center rounded-full bg-brand-100 text-brand-700">
                ✓
              </span>
              No ads. No subscriptions. No selling personal data.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 grid h-5 w-5 flex-none place-items-center rounded-full bg-brand-100 text-brand-700">
                ✓
              </span>
              Account deletion in two taps. We remove your data permanently
              within 30 days.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 grid h-5 w-5 flex-none place-items-center rounded-full bg-brand-100 text-brand-700">
                ✓
              </span>
              Wellness only — Vital30 is not medical advice and doesn&rsquo;t
              diagnose or treat conditions.
            </li>
          </ul>
        </Container>
      </section>
    </>
  );
}
