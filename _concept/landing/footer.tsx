import { Logo } from "./header";

const footerLinks = [
  { label: "Docs", href: "#" },
  { label: "Changelog", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "Contact", href: "#" },
];

export function SiteFooter() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 sm:flex-row">
        <Logo />
        <nav className="flex items-center gap-7">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <p className="font-mono text-xs text-muted-foreground">© 2026 keykit</p>
      </div>
    </footer>
  );
}
