import Link from 'next/link';
import { ArrowRightIcon, SparklesIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useTranslate } from '@keykithq/sdk/react';

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
  const { t } = useTranslate();

  return (
    <section className="relative overflow-hidden pb-8 pt-12 sm:pb-16 sm:pt-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center lg:gap-16">
        <div className="text-center lg:text-left">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
            <SparklesIcon className="size-3.5" />
            {t(
              'landing.hero.badge',
              'Live on Keykit — change this page from the dashboard'
            )}
          </Badge>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {t('landing.hero.title', 'Keykit')}
            <span className="block text-primary">
              {t('landing.hero.headline-accent', 'Product copy, localized')}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
            {t(
              'landing.hero.subtitle',
              'Discover keys in your app, review translations with your team, and ship every locale from one dashboard.'
            )}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <Button asChild size="lg" className="min-w-[160px]">
              <Link href="/auth/join">
                {t('landing.hero.get-started', 'Get started')}
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-w-[160px]"
            >
              <a href="#features">
                {t('landing.hero.explore', 'See how it works')}
              </a>
            </Button>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border/60 pt-8 text-left">
            {[
              {
                label: t('landing.hero.stat-languages', 'Languages'),
                value: t('landing.hero.stat-languages-value', '4+'),
              },
              {
                label: t('landing.hero.stat-keys', 'Key discovery'),
                value: t('landing.hero.stat-keys-value', 'Auto'),
              },
              {
                label: t('landing.hero.stat-review', 'Review'),
                value: t('landing.hero.stat-review-value', 'Built-in'),
              },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-heading text-xl font-semibold text-foreground">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <Card className="border-border/80 bg-card/90 shadow-xl shadow-black/20 ring-1 ring-border/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm">
                {t('landing.hero.preview-title', 'Translation workspace')}
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                en → sv
              </Badge>
            </div>
            <CardDescription>
              {t(
                'landing.hero.preview-description',
                'Keys ingested from your app appear here for review.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {previewRows.map((row) => (
              <div
                key={row.key}
                className="rounded-md border border-border/60 bg-muted/30 p-3"
              >
                <p className="font-mono text-[10px] text-muted-foreground">
                  {row.key}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-border/40 bg-background/60 px-2 py-1.5">
                    <span className="text-[10px] uppercase text-muted-foreground">
                      EN
                    </span>
                    <p className="mt-0.5 font-medium">{row.en}</p>
                  </div>
                  <div className="rounded border border-primary/30 bg-primary/5 px-2 py-1.5">
                    <span className="text-[10px] uppercase text-primary">
                      SV
                    </span>
                    <p className="mt-0.5 font-medium">{row.sv}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HeroSection;
