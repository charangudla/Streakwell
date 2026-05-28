import Link from "next/link";
import { Container } from "./Container";

const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { href: "/challenges", label: "Challenges" },
      { href: "/download", label: "Download" },
      { href: "/about", label: "About" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
      { href: "/health-disclaimer", label: "Health disclaimer" },
    ],
  },
  {
    title: "Contact",
    links: [{ href: "/contact", label: "Get in touch" }],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-surface-soft">
      {/* Brand on its own line at the top, then Product / Legal /
          Contact as THREE COLUMNS SIDE BY SIDE, each column titled +
          links stacked vertically underneath. On phones the three
          columns stay side by side (3-col grid all the way down)
          because each has at most 3 short links and they fit
          comfortably even at 360px wide. */}
      <Container className="py-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-ink"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
            V
          </span>
          Vital30
          <span className="hidden text-sm font-normal text-ink-muted sm:inline">
            · 30 days. Better habits. Healthier you.
          </span>
        </Link>

        <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:gap-x-8">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink sm:text-sm">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-ink-muted">
          &copy; {new Date().getFullYear()} Prodigi Solutions LLC. Vital30 is
          wellness guidance, not medical advice.
        </div>
      </Container>
    </footer>
  );
}
