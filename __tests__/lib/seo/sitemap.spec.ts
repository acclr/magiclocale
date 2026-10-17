import { landingSite } from '@/content/landing/site';
import {
  marketingSitemapUrls,
  renderRobotsTxt,
  renderSitemapXml,
} from '@/lib/seo/sitemap';

describe('sitemap', () => {
  it('lists every marketing page in every locale', () => {
    const urls = marketingSitemapUrls('https://www.keykit.dev/');
    expect(urls).toHaveLength(
      landingSite.pages.length * landingSite.locales.length
    );
    expect(urls.map((url) => url.loc)).toEqual(
      expect.arrayContaining([
        'https://www.keykit.dev/',
        'https://www.keykit.dev/sv',
        'https://www.keykit.dev/guides',
        'https://www.keykit.dev/sv/keykit-vs-lokalise',
      ])
    );
  });

  it('advertises locale alternates, including x-default', () => {
    const home = marketingSitemapUrls('https://www.keykit.dev').find(
      (url) => url.loc === 'https://www.keykit.dev/'
    );
    expect(home?.alternates).toEqual([
      { hreflang: 'en', href: 'https://www.keykit.dev/' },
      { hreflang: 'sv', href: 'https://www.keykit.dev/sv' },
      { hreflang: 'x-default', href: 'https://www.keykit.dev/' },
    ]);
  });

  it('renders sitemap and robots documents', () => {
    const xml = renderSitemapXml(
      marketingSitemapUrls('https://www.keykit.dev')
    );
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<loc>https://www.keykit.dev/sv/guides</loc>');
    expect(xml).toContain('hreflang="x-default"');

    expect(renderRobotsTxt('https://www.keykit.dev/')).toContain(
      'Sitemap: https://www.keykit.dev/sitemap.xml'
    );
  });
});
