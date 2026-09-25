import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import LandingLocaleSwitcher from './LandingLocaleSwitcher';
import { useTranslate } from '@keykithq/sdk/react';
import { LogoWhite } from '@/components/shared/logo';

type LandingShellProps = {
  children: ReactNode;
};

const navLinks = [
  { href: '#features', key: 'landing.nav.features', fallback: 'Features' },
  { href: '#pricing', key: 'landing.nav.pricing', fallback: 'Pricing' },
  { href: '#faq', key: 'landing.nav.faq', fallback: 'FAQ' },
] as const;

const LandingShell = ({ children }: LandingShellProps) => {
  const { t } = useTranslate();

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-[40%] left-1/2 h-[720px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_22%,transparent)_0%,transparent_65%)] opacity-80" />
        <div className="absolute top-[20%] -right-[10%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--secondary)_18%,transparent)_0%,transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(to right, color-mix(in oklch, var(--border) 40%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in oklch, var(--border) 40%, transparent) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            maskImage:
              'linear-gradient(to bottom, black 0%, black 45%, transparent 100%)',
          }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="font-heading text-lg font-semibold tracking-tight text-foreground"
          >
            <LogoWhite className="h-[30px]" />
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {navLinks.map((item) => (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <a href={item.href}>{t(item.key, item.fallback)}</a>
              </Button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LandingLocaleSwitcher />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/auth/login">
                {t('landing.nav.sign-in', 'Sign in')}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/join">
                {t('landing.nav.sign-up', 'Sign up')}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-sm font-semibold">
              {t('landing.nav.brand', 'Keykit')}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t(
                'landing.footer.tagline',
                'Product copy, localized — with a dashboard your team actually uses.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/join">
                {t('landing.hero.get-started', 'Get started')}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="#faq">{t('landing.nav.faq', 'FAQ')}</a>
            </Button>
          </div>
        </div>
        <Separator />
        <p className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          {t(
            'landing.footer.note',
            'This marketing site is powered by Keykit — edit any string from Translation Projects.'
          )}
        </p>
      </footer>
    </div>
  );
};

export default LandingShell;
