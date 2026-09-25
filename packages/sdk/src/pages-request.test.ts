import { describe, expect, it, vi } from 'vitest';

import { resolveKeykitPage } from './pages-request';

const routing = {
  routing: 'path' as const,
  defaultLocale: 'en',
  locales: ['en', 'sv', 'dk'],
  pages: ['pricing'],
  apiKey: 'kk_test',
  projectId: 'prj_test',
  baseUrl: '',
  delivery: 'static' as const,
};

describe('resolveKeykitPage', () => {
  it('loads the locale from the path', async () => {
    const load = vi.fn(async (locale: string) => ({
      bundle: null,
      catalogs: { [locale]: { hello: locale } },
      sourceLocale: 'en',
    }));

    const result = await resolveKeykitPage(
      { ...routing, load },
      { resolvedUrl: '/sv' }
    );

    expect(load).toHaveBeenCalledWith('sv');
    expect(result).toMatchObject({
      props: {
        keykit: {
          locale: 'sv',
          slug: '',
          config: {
            delivery: 'static',
            catalogs: { sv: { hello: 'sv' } },
          },
        },
      },
    });
  });

  it('treats / and /en as the default locale and /dk as Danish', async () => {
    const root = await resolveKeykitPage(routing, { resolvedUrl: '/' });
    const english = await resolveKeykitPage(routing, { resolvedUrl: '/en' });
    const danish = await resolveKeykitPage(routing, { resolvedUrl: '/dk' });

    expect(root).toMatchObject({ props: { keykit: { locale: 'en', slug: '' } } });
    expect(english).toMatchObject({
      props: { keykit: { locale: 'en', slug: '' } },
    });
    expect(danish).toMatchObject({
      props: { keykit: { locale: 'dk', slug: '' } },
    });
  });

  it('returns notFound for paths that are not landing pages', async () => {
    await expect(
      resolveKeykitPage(routing, { resolvedUrl: '/teams/acme' })
    ).resolves.toEqual({ notFound: true });
  });

  it('keeps the page slug when the locale changes', async () => {
    const result = await resolveKeykitPage(routing, {
      resolvedUrl: '/sv/pricing',
    });
    expect(result).toMatchObject({
      props: { keykit: { locale: 'sv', slug: 'pricing' } },
    });
  });
});
