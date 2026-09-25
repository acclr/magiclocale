import { isGlobMatch, matchGlobPattern } from '../../lib/path-glob';

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
});
