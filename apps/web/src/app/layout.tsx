import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InstallPrompt } from "@/components/InstallPrompt";
import { JsonLd } from "@/components/JsonLd";
import { MobileTabBar } from "@/components/MobileTabBar";
import { APP_NAME, APP_TAGLINE, SITE_URL } from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Join simple 30-day wellness challenges, check in daily, track progress, and share your status.",
  applicationName: APP_NAME,
  authors: [{ name: APP_NAME }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Join simple 30-day wellness challenges, check in daily, track progress, and share your status.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Join simple 30-day wellness challenges, check in daily, track progress, and share your status.",
  },
};

export const viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: APP_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  sameAs: [] as string[],
  contactPoint: [
    {
      "@type": "ContactPoint",
      email: "hello@vital30.com",
      contactType: "customer support",
      availableLanguage: ["English"],
    },
  ],
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: APP_NAME,
  url: SITE_URL,
  description: `${APP_NAME} — ${APP_TAGLINE}`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <JsonLd data={[ORGANIZATION_LD, WEBSITE_LD]} />
        <Header />
        {/* Bottom padding accommodates the MobileTabBar on phone-sized
            app routes (the tab bar is fixed and ~60px tall, plus a safe-
            area inset). Desktop ignores via md:pb-0. The tab bar itself
            decides whether to render based on route + auth. */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <InstallPrompt />
        <MobileTabBar />
      </body>
    </html>
  );
}
