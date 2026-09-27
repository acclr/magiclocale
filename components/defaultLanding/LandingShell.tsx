import { hrefForLocaleSlug } from '@keykithq/sdk/routing';
import { useKeykit } from '@keykithq/sdk/react';
import {
  Bars3Icon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useId, useState, type ReactNode } from 'react';

import { LogoWhite } from '@/components/shared/logo';
import { marketingDirectories } from '@/content/landing/directory';
import { landingRouting } from '@/content/landing/site';

import LandingAccountNav from './LandingAccountNav';
import LandingLocaleSwitcher from './LandingLocaleSwitcher';

type LandingShellProps = {
  children: ReactNode;
};

const LandingShell = ({ children }: LandingShellProps) => {
  const { translate, locale } = useKeykit();
  const homeHref = hrefForLocaleSlug(locale, '', landingRouting);
  const pageHref = (slug: string) =>
    hrefForLocaleSlug(locale, slug, landingRouting);
  const productLinks = [
    {
      href: `${homeHref}#features`,
      key: 'landing.nav.features',
      fallback: 'Features',
    },
    {
      href: `${homeHref}#pricing`,
      key: 'landing.nav.pricing',
      fallback: 'Pricing',
    },
  ];
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!openMenu) {
      return;
    }
    const close = () => setOpenMenu(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (!target.closest('[data-nav-menu]')) {
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [openMenu]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4">
        <div className="w-full max-w-6xl">
          <nav
            className={`pointer-events-auto flex w-full items-center justify-between gap-4 transition-all duration-500 ease-out ${
              scrolled
                ? 'shadow-pill mt-3 rounded-full bg-surface/85 px-4 py-2.5 backdrop-blur-xl sm:px-6'
                : 'mt-0 bg-transparent px-2 py-5 sm:px-6'
            }`}
          >
            <Link href={homeHref} locale={false} className="shrink-0">
              <LogoWhite className="h-7" />
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              {productLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {translate(item.key, item.fallback)}
                </a>
              ))}
              {marketingDirectories.map((group) => {
                const expanded = openMenu === group.id;
                return (
                  <div key={group.id} className="relative" data-nav-menu>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      aria-expanded={expanded}
                      aria-controls={`${menuId}-${group.id}`}
                      onClick={() =>
                        setOpenMenu((current) =>
                          current === group.id ? null : group.id
                        )
                      }
                    >
                      {translate(group.labelKey, group.label)}
                      <ChevronDownIcon
                        className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {expanded ? (
                      <div
                        id={`${menuId}-${group.id}`}
                        className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 rounded-xl bg-surface p-2 shadow-pill"
                      >
                        {group.items.map((item) => (
                          <a
                            key={item.slug}
                            href={pageHref(item.slug)}
                            className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-elevated hover:text-foreground"
                            onClick={() => setOpenMenu(null)}
                          >
                            {translate(item.titleKey, item.title)}
                          </a>
                        ))}
                        <a
                          href={pageHref(group.slug)}
                          className="mt-1 block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-elevated"
                          onClick={() => setOpenMenu(null)}
                        >
                          {translate(
                            `landing.nav.${group.id}.all`,
                            group.id === 'guides'
                              ? 'All guides'
                              : 'All comparisons'
                          )}
                        </a>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block">
                <LandingLocaleSwitcher />
              </div>
              <LandingAccountNav />
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-full text-foreground md:hidden"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? (
                  <XMarkIcon className="size-4" />
                ) : (
                  <Bars3Icon className="size-4" />
                )}
              </button>
            </div>
          </nav>

          {menuOpen ? (
            <div className="pointer-events-auto mt-2 max-h-[70vh] overflow-y-auto rounded-xl bg-surface p-4 md:hidden">
              <div className="flex flex-col gap-1">
                {productLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-elevated hover:text-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    {translate(item.key, item.fallback)}
                  </a>
                ))}
              </div>
              {marketingDirectories.map((group) => (
                <div key={group.id} className="mt-4">
                  <a
                    href={pageHref(group.slug)}
                    className="px-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    {translate(group.labelKey, group.label)}
                  </a>
                  <div className="mt-1 flex flex-col">
                    {group.items.map((item) => (
                      <a
                        key={item.slug}
                        href={pageHref(item.slug)}
                        className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-elevated hover:text-foreground"
                        onClick={() => setMenuOpen(false)}
                      >
                        {translate(item.titleKey, item.title)}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between gap-3 sm:hidden">
                <LandingLocaleSwitcher />
                <Link
                  href="/auth/login"
                  className="text-sm text-muted-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  {translate('landing.nav.sign-in', 'Sign in')}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main>{children}</main>

      <footer>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href={homeHref} locale={false}>
              <LogoWhite className="h-6" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {translate(
                'landing.footer.tagline',
                'Product copy, localized — with a dashboard your team actually uses.'
              )}
            </p>
          </div>
          <nav>
            <p className="text-sm font-medium">
              {translate('landing.footer.product', 'Product')}
            </p>
            <ul className="mt-3 space-y-2">
              {productLinks.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {translate(item.key, item.fallback)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {marketingDirectories.map((group) => (
            <nav key={group.id}>
              <a
                href={pageHref(group.slug)}
                className="text-sm font-medium hover:text-foreground"
              >
                {translate(group.labelKey, group.label)}
              </a>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <a
                      href={pageHref(item.slug)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {translate(item.titleKey, item.title)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default LandingShell;
