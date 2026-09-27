import { hrefForLocaleSlug } from '@keykithq/sdk/routing';
import { useKeykit } from '@keykithq/sdk/react';
import Head from 'next/head';

import LandingShell from '@/components/defaultLanding/LandingShell';
import {
  marketingDirectories,
  type DirectoryGroup,
} from '@/content/landing/directory';
import { landingRouting, landingSite } from '@/content/landing/site';
import app from '@/lib/app';

const origin = () => (app.url || '').replace(/\/$/, '');

const ResourceIndex = ({ group }: { group: DirectoryGroup }) => {
  const { translate, locale } = useKeykit();
  const path = hrefForLocaleSlug(locale, group.slug, landingRouting);
  const canonical = `${origin()}${path}`;
  const title = translate(group.titleKey, group.title);
  const description = translate(group.descriptionKey, group.description);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        {landingSite.locales.map((code) => (
          <link
            key={code}
            rel="alternate"
            hrefLang={code}
            href={`${origin()}${hrefForLocaleSlug(code, group.slug, landingRouting)}`}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${origin()}${hrefForLocaleSlug(landingSite.defaultLocale, group.slug, landingRouting)}`}
        />
      </Head>
      <LandingShell>
        <section className="mx-auto max-w-6xl px-6 pt-36 pb-20 sm:pt-44">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {translate(group.labelKey, group.label)}
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
          <ul className="mt-12 grid gap-3">
            {group.items.map((item) => (
              <li key={item.slug}>
                <a
                  href={hrefForLocaleSlug(locale, item.slug, landingRouting)}
                  className="block rounded-xl bg-surface px-6 py-5 transition-colors hover:bg-elevated"
                >
                  <h2 className="text-lg font-semibold tracking-tight">
                    {translate(item.titleKey, item.title)}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {translate(item.descriptionKey, item.description)}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </LandingShell>
    </>
  );
};

export function GuidesIndexPage() {
  const group = marketingDirectories.find((item) => item.id === 'guides');
  if (!group) {
    return null;
  }
  return <ResourceIndex group={group} />;
}

export function CompareIndexPage() {
  const group = marketingDirectories.find((item) => item.id === 'compare');
  if (!group) {
    return null;
  }
  return <ResourceIndex group={group} />;
}
