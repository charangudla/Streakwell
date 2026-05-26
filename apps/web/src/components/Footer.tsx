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
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-ink"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
                V
              </span>
              Vital30
            </Link>
            <p className="mt-4 max-w-xs text-sm text-ink-muted">
              30 days. Better habits. Healthier you.
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-ink">{group.title}</h3>
              <ul className="mt-4 space-y-3">
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
        <div className="mt-12 border-t border-slate-200 pt-6 text-xs text-ink-muted">
          &copy; {new Date().getFullYear()} Vital30. Wellness guidance, not
          medical advice.
        </div>
      </Container>
    </footer>
  );
}
