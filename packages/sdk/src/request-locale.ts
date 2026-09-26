const LOCALE_TAG = /^[A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/;

export type RequestLocaleInput = {
  cookieLocale?: string | null;
  headerLocale?: string | null;
  acceptLanguage?: string | null;
  defaultLocale: string;
  /** When set, cookie, header, and Accept-Language must match one of these. */
  locales?: readonly string[] | null;
};

/**
 * Cookie wins, then `x-keykit-locale`, then Accept-Language against `locales`,
 * then the default locale.
 */
export function resolveRequestLocale(input: RequestLocaleInput): string {
  const allowed = input.locales?.length ? new Set(input.locales) : null;
  const fromCookie = pickLocale(input.cookieLocale, allowed);
  if (fromCookie) {
    return fromCookie;
  }
  const fromHeader = pickLocale(input.headerLocale, allowed);
  if (fromHeader) {
    return fromHeader;
  }
  if (allowed) {
    const negotiated = negotiateAcceptLanguage(
      input.acceptLanguage,
      input.locales ?? []
    );
    if (negotiated) {
      return negotiated;
    }
  }
  return input.defaultLocale;
}

function pickLocale(
  candidate: string | null | undefined,
  allowed: ReadonlySet<string> | null
): string | null {
  const value = candidate?.trim() ?? '';
  if (!value) {
    return null;
  }
  if (allowed) {
    return allowed.has(value) ? value : null;
  }
  return LOCALE_TAG.test(value) ? value : null;
}

function negotiateAcceptLanguage(
  header: string | null | undefined,
  locales: readonly string[]
): string | null {
  if (!header || locales.length === 0) {
    return null;
  }

  const requested = header
    .split(',')
    .map((part) => {
      const [tagPart, ...params] = part.trim().split(';');
      const tag = tagPart?.trim().toLowerCase() ?? '';
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag, q: Number.isFinite(q) ? q : 0 };
    })
    .filter((item) => item.tag.length > 0 && item.tag !== '*')
    .sort((left, right) => right.q - left.q);

  const available = locales.map((locale) => ({
    locale,
    lower: locale.toLowerCase(),
  }));

  for (const { tag } of requested) {
    const exact = available.find((item) => item.lower === tag);
    if (exact) {
      return exact.locale;
    }
    const primary = tag.split('-')[0] ?? tag;
    const prefix = available.find(
      (item) => item.lower === primary || item.lower.startsWith(`${primary}-`)
    );
    if (prefix) {
      return prefix.locale;
    }
  }

  return null;
}
