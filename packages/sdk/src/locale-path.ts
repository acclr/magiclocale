export type LocaleRouting = {
  locales: readonly string[];
  defaultLocale: string;
  /** Extra page slugs. The home page is an empty slug and is always included. */
  pages?: readonly string[];
};

export type LocaleMatch = {
  locale: string;
  slug: string;
};

/**
 * `/` and `/{defaultLocale}` are the default locale.
 * `/{locale}` and `/{locale}/{page}` are the others.
 * `/{page}` is a default-locale subpage.
 */
export function matchLocalePath(
  pathname: string,
  routing: LocaleRouting
): LocaleMatch | null {
  const locales = new Set(routing.locales);
  if (!locales.has(routing.defaultLocale)) {
    return null;
  }

  const pages = new Set(
    (routing.pages ?? []).filter((slug) => slug.length > 0)
  );
  const segments = normalizePath(pathname).split('/').filter(Boolean);

  if (segments.length === 0) {
    return { locale: routing.defaultLocale, slug: '' };
  }

  if (segments.length === 1) {
    const [segment] = segments;
    if (locales.has(segment)) {
      return { locale: segment, slug: '' };
    }
    if (pages.has(segment)) {
      return { locale: routing.defaultLocale, slug: segment };
    }
    return null;
  }

  if (
    segments.length === 2 &&
    locales.has(segments[0]) &&
    pages.has(segments[1])
  ) {
    return { locale: segments[0], slug: segments[1] };
  }

  return null;
}

export function hrefForLocale(
  currentPath: string,
  locale: string,
  routing: LocaleRouting
): string {
  const matched = matchLocalePath(currentPath, routing);
  return hrefForLocaleSlug(locale, matched?.slug ?? '', routing);
}

export function hrefForLocaleSlug(
  locale: string,
  slug: string,
  routing: LocaleRouting
): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  if (!slug) {
    return prefix || '/';
  }
  return `${prefix}/${slug}`;
}

function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split('?')[0]?.split('#')[0] ?? '/';
  const withSlash = withoutQuery.startsWith('/')
    ? withoutQuery
    : `/${withoutQuery}`;
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1);
  }
  return withSlash || '/';
}
