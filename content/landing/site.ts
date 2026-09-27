/**
 * Code-managed marketing site.
 *
 * `/` and `/en` serve the default locale. Every other locale is `/{locale}`
 * (for example `/sv` and `/dk`). Add a language here, then add it on the
 * landing project in the dashboard.
 *
 * Add a page by appending `{ id, slug }` and registering its component in
 * `content/landing/pages.tsx`. `slug` is the path segment (`pricing` →
 * `/pricing` and `/sv/pricing`). An empty slug is the home page.
 */
export type LandingPageDefinition = {
  id: string;
  slug: string;
};

export const landingSite = {
  defaultLocale: 'en',
  locales: ['en', 'sv'],
  pages: [
    { id: 'home', slug: '' },
    { id: 'guides', slug: 'guides' },
    { id: 'compare', slug: 'compare' },
    { id: 'how-it-works', slug: 'how-it-works' },
    {
      id: 'automatic-key-discovery',
      slug: 'automatic-translation-key-discovery',
    },
    { id: 'translation-key-lifecycle', slug: 'translation-key-lifecycle' },
    { id: 'react-translations', slug: 'react-translations' },
    { id: 'nextjs-translations', slug: 'nextjs-translations' },
    { id: 'translation-management', slug: 'translation-management' },
    { id: 'keykit-vs-lokalise', slug: 'keykit-vs-lokalise' },
    { id: 'keykit-vs-phrase', slug: 'keykit-vs-phrase' },
    { id: 'keykit-vs-crowdin', slug: 'keykit-vs-crowdin' },
    { id: 'keykit-vs-tolgee', slug: 'keykit-vs-tolgee' },
  ] satisfies LandingPageDefinition[],
};

export const landingRouting = {
  defaultLocale: landingSite.defaultLocale,
  locales: landingSite.locales,
  pages: landingSite.pages
    .map((page) => page.slug)
    .filter((slug) => slug.length > 0),
};
