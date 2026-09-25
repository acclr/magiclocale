import { safeCallbackPath } from '../../lib/safe-callback-url';

describe('safeCallbackPath', () => {
  it('returns the marketing home for /, locale prefixes, and absolute home URLs', () => {
    expect(safeCallbackPath('/')).toBe('/');
    expect(safeCallbackPath('/en')).toBe('/');
    expect(safeCallbackPath('https://keykit.dev/')).toBe('/');
    expect(safeCallbackPath('https://keykit.dev/en')).toBe('/');
    expect(safeCallbackPath(encodeURI('https://keykit.dev/'))).toBe('/');
  });

  it('keeps same-app relative paths and rejects protocol-relative URLs', () => {
    expect(safeCallbackPath('/dashboard')).toBe('/dashboard');
    expect(safeCallbackPath('/teams/acme?tab=keys')).toBe(
      '/teams/acme?tab=keys'
    );
    expect(safeCallbackPath('https://keykit.dev/dashboard')).toBe('/dashboard');
    expect(safeCallbackPath('//evil.example')).toBeNull();
    expect(safeCallbackPath(undefined)).toBeNull();
    expect(safeCallbackPath('')).toBeNull();
  });
});
