import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about Vital30 — how challenges work, what counts as a check-in, missed days, account deletion, privacy, and more.",
  alternates: { canonical: "/faq" },
};

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What is Vital30?",
    a: "Vital30 is a free 30-day wellness challenge app. You pick a habit you want to build or break, check in each day for 30 days, and track your active days.",
  },
  {
    q: "How much does it cost?",
    a: "Vital30 is free during launch. There are no subscriptions, no ads, and no premium tier.",
  },
  {
    q: "What counts as a check-in?",
    a: "Each day you have three options on your active challenge: ‘Yes, completed’, ‘No, missed today’, or ‘Skip today’. Tap once per day per challenge.",
  },
  {
    q: "What happens if I miss a day?",
    a: "A missed day breaks your current streak — but it does not erase your active days. The goal is consistency over 30 days, not a perfect streak. Recovery matters more than perfection.",
  },
  {
    q: "Can I do more than one challenge at a time?",
    a: "Yes. You can have multiple active challenges, each with its own daily check-in and progress.",
  },
  {
    q: "Can I check in for yesterday?",
    a: "No. Check-ins are for today only. If you miss a day, mark it as missed and pick the habit back up tomorrow.",
  },
  {
    q: "Will Vital30 give me medical or fitness advice?",
    a: "No. Vital30 is a general wellness app — habit tracking and motivation only. It does not diagnose, treat, or replace care from a qualified healthcare professional. See the health disclaimer for full details.",
  },
  {
    q: "Are challenges safe for people with medical conditions?",
    a: "Vital30 is wellness guidance, not a medical tool. If you have a medical condition, are pregnant, take medication, or experience concerning symptoms, consult a healthcare professional before joining any challenge — especially diet, exercise, or substance-related ones.",
  },
  {
    q: "Can children use Vital30?",
    a: "Users must be 13 or older. Anyone under 18 should use Vital30 under the guidance of a parent or guardian.",
  },
  {
    q: "Where is my data stored?",
    a: "Your account data and challenge activity are stored on Vital30's secure servers. We do not sell personal data. See the privacy policy for details.",
  },
  {
    q: "How do I delete my account?",
    a: "In the mobile app: Profile → Edit Profile → Delete Account. This permanently removes your account, challenges, check-ins, and share events. You can also email hello@vital30.com with the subject ‘Data Deletion Request’.",
  },
  {
    q: "Why is the website read-only?",
    a: "The website is for browsing challenges and learning about Vital30. Account features — joining a challenge, checking in, tracking progress — live in the mobile app so the experience stays focused and fast.",
  },
  {
    q: "When does the app launch?",
    a: "Submission to the App Store and Google Play is in progress. Email hello@vital30.com to be notified at launch.",
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 via-white to-white py-16 sm:py-20">
        <Container className="max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mt-4 text-base text-ink-muted sm:text-lg">
            The short version. If something is missing, email{" "}
            <a
              href="mailto:hello@vital30.com"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              hello@vital30.com
            </a>
            .
          </p>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="max-w-3xl">
          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm sm:p-6"
                {...(idx === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink marker:hidden">
                  <span>{faq.q}</span>
                  <span
                    aria-hidden="true"
                    className="grid h-7 w-7 flex-none place-items-center rounded-full bg-slate-100 text-ink-muted transition-transform group-open:rotate-45"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
