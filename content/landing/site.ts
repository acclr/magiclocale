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
  locales: ['en', 'sv', 'dk'],
  pages: [{ id: 'home', slug: '' }] satisfies LandingPageDefinition[],
};

export const landingRouting = {
  defaultLocale: landingSite.defaultLocale,
  locales: landingSite.locales,
  pages: landingSite.pages
    .map((page) => page.slug)
    .filter((slug) => slug.length > 0),
};
