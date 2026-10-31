/**
 * The address search engines index for this site: https://www.keykit.dev.
 * Canonical and share links are built from it.
 *
 * The address in your settings is used as is, except a preview or
 * platform address (magiclocale.vercel.app, *.vercel.app and the like), which
 * serves a copy of this site: links built from it send search engines
 * to the copy. Local work (localhost) is unchanged.
 * Added by a pull request you reviewed (SEOmatic).
 */
const LIVE_ORIGIN = 'https://www.keykit.dev';

const COPY_HOSTS = ['magiclocale.vercel.app'];

const PLATFORM_SUFFIXES = [
  '.vercel.app',
  '.netlify.app',
  '.pages.dev',
  '.workers.dev',
  '.onrender.com',
  '.herokuapp.com',
  '.fly.dev',
  '.up.railway.app',
  '.amplifyapp.com',
  '.web.app',
  '.firebaseapp.com',
  '.github.io',
  '.azurestaticapps.net',
  '.deno.dev',
];

export function publicSiteOrigin(configured?: string | null): string {
  const value = (configured || '').trim();
  if (!value) return process.env.NODE_ENV === 'production' ? LIVE_ORIGIN : value;
  let host: string;
  try {
    host = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`).hostname.toLowerCase();
  } catch {
    return value;
  }
  if (COPY_HOSTS.includes(host) || PLATFORM_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return LIVE_ORIGIN;
  }
  return value;
}
