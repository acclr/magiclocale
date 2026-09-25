/**
 * Minimal glob matcher for Edge middleware. Supports exact paths, a single
 * path segment (`*`), and nested suffixes (`**`).
 *
 * Next.js i18n can present `/` to middleware as `/en` (or `/en/...`). Always
 * strip that prefix before matching public/auth routes.
 */
const I18N_LOCALES = ['en'] as const;

export function stripI18nLocalePrefix(pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;

  for (const locale of I18N_LOCALES) {
    if (normalized === `/${locale}`) {
      return '/';
    }

    const prefix = `/${locale}/`;
    if (normalized.startsWith(prefix)) {
      const rest = normalized.slice(prefix.length);
      return rest ? `/${rest}` : '/';
    }
  }

  return normalized || '/';
}

export function isPublicHomePath(pathname: string): boolean {
  return stripI18nLocalePrefix(pathname) === '/';
}

export function isGlobMatch(pathname: string, patterns: readonly string[]) {
  return patterns.some((pattern) =>
    matchGlobPattern(stripI18nLocalePrefix(pathname), pattern)
  );
}

export function matchGlobPattern(pathname: string, pattern: string) {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  }

  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    if (!pathname.startsWith(`${prefix}/`)) {
      return false;
    }
    const rest = pathname.slice(prefix.length + 1);
    return rest.length > 0 && !rest.includes('/');
  }

  return pathname === pattern;
}
