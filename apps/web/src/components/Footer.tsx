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
    <footer className="mt-24 border-t border-slate-200 bg-surface-soft">
      {/* Compact one-row layout: brand on the left, Product / Legal /
          Contact groups inline on the right with links separated by
          dots. Was a 4-column vertical-list grid (~360px tall) which
          stretched the page out unnecessarily on phones. Now ~110px
          tall on desktop, stacks cleanly when there's no room. */}
      <Container className="py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
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

          <nav className="flex flex-wrap gap-x-8 gap-y-4">
            {FOOTER_GROUPS.map((group) => (
              <div
                key={group.title}
                className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1"
              >
                <span className="mr-1 text-xs font-bold uppercase tracking-wide text-ink">
                  {group.title}
                </span>
                {group.links.map((link, i) => (
                  <span key={link.href} className="flex items-baseline gap-1.5">
                    {i > 0 ? (
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                    ) : null}
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </span>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-ink-muted">
          &copy; {new Date().getFullYear()} Vital30. Wellness guidance, not
          medical advice.
        </div>
      </Container>
    </footer>
  );
}
