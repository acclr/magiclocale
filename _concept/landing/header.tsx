import { useEffect, useState } from "react";

export function Logo() {
  return (
    <a href="/" className="flex items-baseline">
      <span className="font-mono text-sm font-medium text-muted-foreground">{"{"}</span>
      <span className="text-lg font-semibold tracking-tight text-foreground">keykit</span>
      <span className="font-mono text-sm font-medium text-muted-foreground">{"}"}</span>
      <span className="ml-1 font-mono text-xs text-muted-foreground">.dev</span>
    </a>
  );
}

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Developers", href: "#developers" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4">
      <nav
        className={`pointer-events-auto flex w-full items-center justify-between gap-6 transition-all duration-500 ease-out ${
          scrolled
            ? "shadow-pill mt-3 max-w-4xl rounded-full bg-surface/85 px-6 py-2.5 backdrop-blur-xl"
            : "mt-0 max-w-6xl bg-transparent px-6 py-5"
        }`}
      >
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#cta"
          className="rounded-full bg-blue px-4 py-1.5 text-sm font-semibold text-background transition-colors hover:bg-blue-soft"
        >
          Start free
        </a>
      </nav>
    </header>
  );
}
