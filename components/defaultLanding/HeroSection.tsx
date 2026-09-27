import Link from 'next/link';

import { useKeykit } from '@keykithq/sdk/react';

import Reveal from './Reveal';

const previewRows = [
  { key: 'landing.hero.title', en: 'Keykit', sv: 'Keykit' },
  {
    key: 'landing.hero.subtitle',
    en: 'Ship copy in every language',
    sv: 'Leverera text på alla språk',
  },
  {
    key: 'landing.nav.sign-up',
    en: 'Sign up',
    sv: 'Registrera dig',
  },
] as const;

const HeroSection = () => {
  const { translate } = useKeykit();

  const stats = [
    {
      label: translate('landing.hero.stat-languages', 'Languages'),
      value: translate('landing.hero.stat-languages-value', '4+'),
    },
    {
      label: translate('landing.hero.stat-keys', 'Key discovery'),
      value: translate('landing.hero.stat-keys-value', 'Auto'),
    },
    {
      label: translate('landing.hero.stat-review', 'Review'),
      value: translate('landing.hero.stat-review-value', 'Built-in'),
    },
  ];

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-6 pt-36 pb-16 sm:pt-44 sm:pb-20">
        <Reveal className="mx-auto w-full text-center">
          <p className="font-mono text-xs font-medium text-muted-foreground">
            {translate(
              'landing.hero.badge',
              'Live on Keykit — change this page from the dashboard'
            )}
          </p>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {translate('landing.hero.title', 'Keykit')}
            <span className="mt-2 block text-foreground/90">
              {translate(
                'landing.hero.headline-accent',
                'Product copy, localized'
              )}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {translate(
              'landing.hero.subtitle',
              'Discover keys in your app, review translations with your team, and ship every locale from one dashboard.'
            )}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/join"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
            >
              {translate('landing.hero.get-started', 'Get started')}
            </Link>
            <a
              href="#features"
              className="rounded-lg bg-surface px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
            >
              {translate('landing.hero.explore', 'See how it works')}
            </a>
          </div>
        </Reveal>

        <Reveal delay={150} className="relative mt-16 sm:mt-20">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-surface">
            <div className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="font-mono text-xs text-muted-foreground">
                {translate(
                  'landing.hero.preview-title',
                  'Translation workspace'
                )}
              </span>
              <span className="rounded-lg bg-elevated px-2.5 py-1 font-mono text-[10px] tracking-wide text-foreground">
                en → sv
              </span>
            </div>

            <div className="mx-3 space-y-1 pb-3">
              {previewRows.map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-1 items-center gap-x-4 gap-y-1 rounded-lg bg-background/60 px-4 py-3 sm:grid-cols-[minmax(0,14rem)_1fr_auto]"
                >
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {row.key}
                  </span>
                  <span className="truncate text-sm text-foreground">
                    {row.en}
                  </span>
                  <span className="w-fit rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary sm:justify-self-end">
                    {row.sv}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid gap-2 px-3 pb-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg bg-background/60 px-4 py-3"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <p className="px-5 pb-4 text-xs leading-relaxed text-muted-foreground">
              {translate(
                'landing.hero.preview-description',
                'Keys ingested from your app appear here for review.'
              )}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default HeroSection;
