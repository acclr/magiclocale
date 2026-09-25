import {
  isGlobMatch,
  isPublicHomePath,
  matchGlobPattern,
  stripI18nLocalePrefix,
} from '../../lib/path-glob';

describe('path glob matcher', () => {
  it('matches exact paths and globstar prefixes', () => {
    expect(matchGlobPattern('/api/health', '/api/health')).toBe(true);
    expect(matchGlobPattern('/auth/login', '/auth/**')).toBe(true);
    expect(matchGlobPattern('/auth', '/auth/**')).toBe(true);
    expect(matchGlobPattern('/api/auth/callback/github', '/api/auth/**')).toBe(
      true
    );
    expect(matchGlobPattern('/dashboard', '/auth/**')).toBe(false);
  });

  it('matches a single path segment with *', () => {
    expect(matchGlobPattern('/invitations/abc', '/invitations/*')).toBe(true);
    expect(matchGlobPattern('/invitations', '/invitations/*')).toBe(false);
    expect(matchGlobPattern('/invitations/abc/extra', '/invitations/*')).toBe(
      false
    );
    expect(matchGlobPattern('/.well-known/saml.cer', '/.well-known/*')).toBe(
      true
    );
  });

  it('treats a list of patterns as a match if any pattern hits', () => {
    const routes = ['/', '/api/hello', '/auth/**', '/invitations/*'];
    expect(isGlobMatch('/', routes)).toBe(true);
    expect(isGlobMatch('/api/hello', routes)).toBe(true);
    expect(isGlobMatch('/auth/join', routes)).toBe(true);
    expect(isGlobMatch('/invitations/token', routes)).toBe(true);
    expect(isGlobMatch('/teams/acme', routes)).toBe(false);
    expect(isGlobMatch('/dashboard', routes)).toBe(false);
  });

  it('strips the Next.js i18n locale prefix before matching', () => {
    expect(stripI18nLocalePrefix('/en')).toBe('/');
    expect(stripI18nLocalePrefix('/en/')).toBe('/');
    expect(stripI18nLocalePrefix('/en/dashboard')).toBe('/dashboard');
    expect(stripI18nLocalePrefix('/auth/login')).toBe('/auth/login');
    expect(isPublicHomePath('/')).toBe(true);
    expect(isPublicHomePath('/en')).toBe(true);
    expect(isPublicHomePath('/en/dashboard')).toBe(false);
    expect(isGlobMatch('/en', ['/'])).toBe(true);
    expect(isGlobMatch('/en/auth/login', ['/auth/**'])).toBe(true);
    expect(isGlobMatch('/en/dashboard', ['/'])).toBe(false);
  });
});
