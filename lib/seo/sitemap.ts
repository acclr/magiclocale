import { hrefForLocaleSlug } from '@keykithq/sdk/routing';

import { landingRouting, landingSite } from '@/content/landing/site';

export type SitemapAlternate = {
  hreflang: string;
  href: string;
};

export type SitemapUrl = {
  loc: string;
  alternates: SitemapAlternate[];
};

export function siteOrigin(url: string) {
  return url.replace(/\/+$/, '');
}

export function marketingSitemapUrls(origin: string): SitemapUrl[] {
  const base = siteOrigin(origin);

  return landingSite.pages.flatMap((page) =>
    landingSite.locales.map((locale) => {
      const alternates: SitemapAlternate[] = landingSite.locales.map(
        (code) => ({
          hreflang: code,
          href: absolute(base, code, page.slug),
        })
      );
      alternates.push({
        hreflang: 'x-default',
        href: absolute(base, landingSite.defaultLocale, page.slug),
      });

      return {
        loc: absolute(base, locale, page.slug),
        alternates,
      };
    })
  );
}

export function renderSitemapXml(urls: SitemapUrl[]) {
  const entries = urls
    .map((url) => {
      const links = url.alternates
        .map(
          (alternate) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}" />`
        )
        .join('\n');
      return `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n${links}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
}

export function renderRobotsTxt(origin: string) {
  const base = siteOrigin(origin);
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard
Disallow: /invitations/
Disallow: /settings/
Disallow: /teams/
Disallow: /well-known/

Sitemap: ${base}/sitemap.xml
`;
}

function absolute(origin: string, locale: string, slug: string) {
  return `${origin}${hrefForLocaleSlug(locale, slug, landingRouting)}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
