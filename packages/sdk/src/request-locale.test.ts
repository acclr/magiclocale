import { describe, expect, it } from 'vitest';
import { resolveRequestLocale } from './request-locale';

describe('resolveRequestLocale', () => {
  it('prefers the locale cookie over the header and Accept-Language', () => {
    expect(
      resolveRequestLocale({
        cookieLocale: 'sv',
        headerLocale: 'da',
        acceptLanguage: 'en',
        defaultLocale: 'en',
        locales: ['en', 'sv', 'da'],
      })
    ).toBe('sv');
  });

  it('uses x-keykit-locale when the cookie is missing', () => {
    expect(
      resolveRequestLocale({
        headerLocale: 'da',
        acceptLanguage: 'en',
        defaultLocale: 'en',
        locales: ['en', 'sv', 'da'],
      })
    ).toBe('da');
  });

  it('matches Accept-Language against the configured locales', () => {
    expect(
      resolveRequestLocale({
        acceptLanguage: 'fr-FR,fr;q=0.9,sv;q=0.4',
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      })
    ).toBe('sv');
  });

  it('ignores a cookie that is not in the locale list', () => {
    expect(
      resolveRequestLocale({
        cookieLocale: 'fr',
        acceptLanguage: 'sv',
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      })
    ).toBe('sv');
  });

  it('keeps the default locale when Accept-Language has no allowlist', () => {
    expect(
      resolveRequestLocale({
        acceptLanguage: 'sv-SE,sv;q=0.9',
        defaultLocale: 'en',
      })
    ).toBe('en');
  });

  it('accepts a locale cookie when no allowlist is configured', () => {
    expect(
      resolveRequestLocale({
        cookieLocale: 'sv-SE',
        defaultLocale: 'en',
      })
    ).toBe('sv-SE');
  });
});
