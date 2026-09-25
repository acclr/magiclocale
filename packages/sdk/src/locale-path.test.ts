import { describe, expect, it } from 'vitest';

import {
  hrefForLocale,
  hrefForLocaleSlug,
  matchLocalePath,
} from './locale-path';

const routing = {
  locales: ['en', 'sv', 'dk'],
  defaultLocale: 'en',
  pages: ['pricing'],
};

describe('matchLocalePath', () => {
  it('serves the default locale at / and at the explicit prefix', () => {
    expect(matchLocalePath('/', routing)).toEqual({ locale: 'en', slug: '' });
    expect(matchLocalePath('/en', routing)).toEqual({
      locale: 'en',
      slug: '',
    });
    expect(matchLocalePath('/en/', routing)).toEqual({
      locale: 'en',
      slug: '',
    });
  });

  it('serves other locales from their prefix', () => {
    expect(matchLocalePath('/sv', routing)).toEqual({
      locale: 'sv',
      slug: '',
    });
    expect(matchLocalePath('/dk', routing)).toEqual({
      locale: 'dk',
      slug: '',
    });
  });

  it('matches subpages with and without a locale prefix', () => {
    expect(matchLocalePath('/pricing', routing)).toEqual({
      locale: 'en',
      slug: 'pricing',
    });
    expect(matchLocalePath('/sv/pricing', routing)).toEqual({
      locale: 'sv',
      slug: 'pricing',
    });
  });

  it('rejects unknown locales and pages', () => {
    expect(matchLocalePath('/fr', routing)).toBeNull();
    expect(matchLocalePath('/sv/missing', routing)).toBeNull();
    expect(matchLocalePath('/teams/acme', routing)).toBeNull();
  });
});

describe('hrefForLocale', () => {
  it('drops the prefix for the default locale and adds it for others', () => {
    expect(hrefForLocale('/sv', 'en', routing)).toBe('/');
    expect(hrefForLocale('/', 'sv', routing)).toBe('/sv');
    expect(hrefForLocale('/en', 'dk', routing)).toBe('/dk');
    expect(hrefForLocale('/sv/pricing?x=1', 'en', routing)).toBe('/pricing');
    expect(hrefForLocaleSlug('sv', 'pricing', routing)).toBe('/sv/pricing');
    expect(hrefForLocaleSlug('en', '', routing)).toBe('/');
  });
});
