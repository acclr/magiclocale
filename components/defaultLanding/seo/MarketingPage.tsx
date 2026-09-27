import { hrefForLocaleSlug } from '@keykithq/sdk/routing';
import { useKeykit } from '@keykithq/sdk/react';
import Head from 'next/head';
import type { ReactNode } from 'react';

import LandingShell from '@/components/defaultLanding/LandingShell';
import { landingRouting, landingSite } from '@/content/landing/site';
import app from '@/lib/app';

export function marketingPath(locale: string, slug: string) {
  return hrefForLocaleSlug(locale, slug, landingRouting);
}

type FaqItem = {
  question: string;
  answer: string;
};

type MarketingPageProps = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  children: ReactNode;
  faq?: { title: string; items: FaqItem[] };
  finalCta: { title: string; description: string; button: string; href?: string };
};

const origin = () => (app.url || '').replace(/\/$/, '');

const MarketingPage = ({
  slug,
  metaTitle,
  metaDescription,
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  children,
  faq,
  finalCta,
}: MarketingPageProps) => {
  const { locale } = useKeykit();
  const path = marketingPath(locale, slug);
  const canonical = `${origin()}${path}`;
  const faqJson = faq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }
    : null;

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonical} />
        {landingSite.locales.map((code) => (
          <link
            key={code}
            rel="alternate"
            hrefLang={code}
            href={`${origin()}${marketingPath(code, slug)}`}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${origin()}${marketingPath(landingSite.defaultLocale, slug)}`}
        />
        {faqJson ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }}
          />
        ) : null}
      </Head>
      <LandingShell>
        <article className="w-full">
          <header className="mx-auto max-w-6xl px-6 pt-36 pb-8 sm:pt-44">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={primaryCta.href}
                className="rounded-lg bg-primary px-6 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/80"
              >
                {primaryCta.label}
              </a>
              {secondaryCta ? (
                <a
                  href={secondaryCta.href}
                  className="rounded-lg bg-surface px-6 py-2.5 text-center text-sm font-medium text-foreground hover:bg-elevated"
                >
                  {secondaryCta.label}
                </a>
              ) : null}
            </div>
          </header>
          {children}
          {faq ? (
            <section className="mx-auto max-w-6xl px-6 py-16">
              <h2 className="text-3xl font-semibold tracking-tight">{faq.title}</h2>
              <div className="mt-8 max-w-3xl rounded-xl bg-surface px-6">
                {faq.items.map((item) => (
                  <div key={item.question} className="border-b border-white/5 py-5 last:border-0">
                    <h3 className="text-base font-semibold">{item.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          <section className="mx-auto max-w-6xl px-6 py-8">
            <div className="rounded-xl bg-surface px-6 py-16 text-center sm:px-16">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                {finalCta.title}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                {finalCta.description}
              </p>
              <a
                href={finalCta.href ?? '/auth/join'}
                className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/80"
              >
                {finalCta.button}
              </a>
            </div>
          </section>
        </article>
      </LandingShell>
    </>
  );
};

export function SeoSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      {eyebrow ? (
        <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">{title}</h2>
      ) : null}
      <div className="mt-5 max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  );
}

export function SeoCards({
  items,
}: {
  items: { title: string; description: string }[];
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-xl bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-lg bg-background/60 p-4 font-mono text-xs leading-relaxed text-foreground">
      {code}
    </pre>
  );
}

export default MarketingPage;
