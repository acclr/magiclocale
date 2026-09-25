import { createKeykit, type CreateKeykitOptions } from './create-keykit';
import { loadTranslationBundle } from './load-bundle';
import { matchLocalePath, type LocaleRouting } from './locale-path';
import type { KeykitConfig, LocaleCatalogs, TranslationBundle } from './types';

export type KeykitLoadResult = {
  bundle?: TranslationBundle | null;
  catalogs?: LocaleCatalogs;
  sourceCatalog?: Record<string, string>;
  sourceLocale?: string;
};

export type KeykitRoutingProps = {
  locales: string[];
  defaultLocale: string;
  pages: string[];
};

export type KeykitPageProps = {
  config: KeykitConfig;
  locale: string;
  slug: string;
  initialBundle: TranslationBundle | null;
  routing: KeykitRoutingProps | null;
};

export type KeykitServerContext = {
  params?: Partial<Record<string, string | string[] | undefined>>;
  resolvedUrl?: string;
};

export type CreatePagesKeykitOptions = CreateKeykitOptions & {
  /** `path` reads the locale from the URL (`/`, `/en`, `/sv`). */
  routing?: 'path';
  defaultLocale?: string;
  locales?: readonly string[];
  pages?: readonly string[];
  /** Dynamic segment name when `resolvedUrl` is missing. Defaults to `landing`. */
  pathParam?: string;
  load?: (locale: string) => Promise<KeykitLoadResult>;
};

export async function resolveKeykitPage(
  options: CreatePagesKeykitOptions,
  context: KeykitServerContext
): Promise<{ notFound: true } | { props: { keykit: KeykitPageProps } }> {
  const created = createKeykit(options);
  const sourceLocale = created.config.sourceLocale ?? 'en';
  const routing =
    options.routing === 'path' ? normalizeRouting(options, sourceLocale) : null;

  let locale = options.locale ?? created.config.locale ?? sourceLocale;
  let slug = '';

  if (routing) {
    const matched = matchLocalePath(
      pathnameFromContext(context, options.pathParam),
      routing
    );
    if (!matched) {
      return { notFound: true };
    }
    locale = matched.locale;
    slug = matched.slug;
  }

  const loaded = await loadLocale(options, created.config, locale);
  const bundle = loaded?.bundle ?? null;

  return {
    props: {
      keykit: {
        config: toClientConfig(created.config, locale, loaded, bundle),
        locale,
        slug,
        initialBundle: bundle,
        routing: routing
          ? {
              locales: [...routing.locales],
              defaultLocale: routing.defaultLocale,
              pages: [...(routing.pages ?? [])],
            }
          : null,
      },
    },
  };
}

async function loadLocale(
  options: CreatePagesKeykitOptions,
  config: KeykitConfig,
  locale: string
): Promise<KeykitLoadResult | null> {
  try {
    if (options.load) {
      return await options.load(locale);
    }
    if (
      config.delivery === 'static' ||
      !config.baseUrl ||
      !config.projectId ||
      !config.ingestToken
    ) {
      return null;
    }
    return {
      bundle: await loadTranslationBundle(
        { ...config, refreshIntervalMs: 0 },
        locale
      ),
    };
  } catch (error) {
    const normalized =
      error instanceof Error ? error : new Error(String(error));
    console.warn('[Keykit]', normalized.message);
    return null;
  }
}

function toClientConfig(
  config: KeykitConfig,
  locale: string,
  loaded: KeykitLoadResult | null,
  bundle: TranslationBundle | null
): KeykitConfig {
  const sourceLocale = loaded?.sourceLocale || config.sourceLocale || 'en';
  const sourceCatalog = loaded?.sourceCatalog ?? config.sourceCatalog;
  const useStatic =
    config.delivery === 'static' ||
    !config.baseUrl ||
    !config.projectId ||
    !config.ingestToken;

  if (useStatic) {
    const catalogs =
      loaded?.catalogs && Object.keys(loaded.catalogs).length > 0
        ? loaded.catalogs
        : { [locale]: bundle?.translations ?? {} };
    return {
      delivery: 'static',
      baseUrl: config.baseUrl ?? '',
      projectId: config.projectId ?? '',
      ingestToken: config.ingestToken ?? '',
      sourceLocale,
      locale,
      catalogs,
      refreshIntervalMs: 0,
      ...(sourceCatalog ? { sourceCatalog } : {}),
    };
  }

  return {
    delivery: 'live',
    baseUrl: config.baseUrl,
    projectId: config.projectId,
    ingestToken: config.ingestToken,
    sourceLocale,
    locale,
    ...(config.refreshIntervalMs !== undefined
      ? { refreshIntervalMs: config.refreshIntervalMs }
      : {}),
    ...(config.environment ? { environment: config.environment } : {}),
    ...(config.version !== undefined ? { version: config.version } : {}),
    ...(sourceCatalog ? { sourceCatalog } : {}),
  };
}

function normalizeRouting(
  options: CreatePagesKeykitOptions,
  sourceLocale: string
): LocaleRouting {
  const defaultLocale = options.defaultLocale || sourceLocale;
  const locales = options.locales?.length
    ? [...options.locales]
    : [defaultLocale];
  if (!locales.includes(defaultLocale)) {
    locales.unshift(defaultLocale);
  }
  return {
    defaultLocale,
    locales,
    pages: (options.pages ?? []).filter((slug) => slug.length > 0),
  };
}

function pathnameFromContext(
  context: KeykitServerContext,
  pathParam = 'landing'
): string {
  const resolved = context.resolvedUrl?.split('?')[0];
  if (resolved) {
    return resolved.startsWith('/') ? resolved : `/${resolved}`;
  }

  const value = context.params?.[pathParam];
  if (Array.isArray(value)) {
    return value.length > 0 ? `/${value.join('/')}` : '/';
  }
  if (typeof value === 'string' && value.length > 0) {
    return `/${value}`;
  }
  return '/';
}
