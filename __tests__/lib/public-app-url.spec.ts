import { resolvePublicAppUrl } from '../../lib/public-app-url';

describe('resolvePublicAppUrl', () => {
  const original = {
    nextAuth: process.env.NEXTAUTH_URL,
    app: process.env.APP_URL,
    vercel: process.env.VERCEL_URL,
  };

  afterEach(() => {
    process.env.NEXTAUTH_URL = original.nextAuth;
    process.env.APP_URL = original.app;
    process.env.VERCEL_URL = original.vercel;
  });

  it('prefers NEXTAUTH_URL and strips a trailing slash', () => {
    process.env.NEXTAUTH_URL = 'https://app.keykit.com/';
    process.env.APP_URL = 'https://ignored.example';
    process.env.VERCEL_URL = 'ignored.vercel.app';
    expect(resolvePublicAppUrl()).toBe('https://app.keykit.com');
  });

  it('uses VERCEL_URL when auth urls are empty', () => {
    process.env.NEXTAUTH_URL = '';
    process.env.APP_URL = '   ';
    process.env.VERCEL_URL = 'keykit.vercel.app';
    expect(resolvePublicAppUrl()).toBe('https://keykit.vercel.app');
  });
});
