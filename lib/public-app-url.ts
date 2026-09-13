/**
 * Canonical public origin for this deployment. NextAuth throws
 * `Invalid URL` if NEXTAUTH_URL is missing or an empty string.
 */
export function resolvePublicAppUrl(): string {
  const configured = (
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    ''
  ).trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return vercel.startsWith('http')
      ? vercel.replace(/\/+$/, '')
      : `https://${vercel}`;
  }

  return 'http://localhost:4002';
}

export function ensureAuthUrlEnv(): string {
  const url = resolvePublicAppUrl();
  if (!process.env.NEXTAUTH_URL?.trim()) {
    process.env.NEXTAUTH_URL = url;
  }
  if (!process.env.APP_URL?.trim()) {
    process.env.APP_URL = url;
  }
  return url;
}

ensureAuthUrlEnv();
