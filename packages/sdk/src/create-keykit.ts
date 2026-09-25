import type { KeykitConfig, KeykitDelivery, LocaleCatalogs } from './types';

export type CreateKeykitOptions = {
  /** Defaults to `KEYKIT_API_KEY` or `NEXT_PUBLIC_KEYKIT_API_KEY`. */
  apiKey?: string;
  /** Defaults to `KEYKIT_PROJECT_ID` or `NEXT_PUBLIC_KEYKIT_PROJECT_ID`. */
  projectId?: string;
  /**
   * Defaults to `KEYKIT_BASE_URL` or `NEXT_PUBLIC_KEYKIT_BASE_URL`,
   * then `https://www.keykit.dev`. Pass `''` to skip the network.
   */
  baseUrl?: string;
  /** Defaults to `KEYKIT_SOURCE_LOCALE` or `en`. */
  sourceLocale?: string;
  locale?: string;
  delivery?: KeykitDelivery;
  catalogs?: LocaleCatalogs;
  sourceCatalog?: Record<string, string>;
  refreshIntervalMs?: number;
  environment?: string;
  version?: number;
  /** Override for tests. Defaults to `process.env`. */
  env?: Record<string, string | undefined>;
};

export type CreatedKeykit = {
  config: KeykitConfig;
};

type KeykitEnv = {
  apiKey?: string;
  projectId?: string;
  baseUrl?: string;
  sourceLocale?: string;
};

export function createKeykit(options: CreateKeykitOptions = {}): CreatedKeykit {
  const env = readKeykitEnv(options.env ?? process.env);
  const sourceLocale = pick(options.sourceLocale, env.sourceLocale, 'en');
  const baseUrl = pick(
    options.baseUrl,
    env.baseUrl,
    'https://www.keykit.dev'
  ).replace(/\/+$/, '');

  return {
    config: {
      ...(options.delivery ? { delivery: options.delivery } : {}),
      baseUrl,
      projectId: pick(options.projectId, env.projectId),
      ingestToken: pick(options.apiKey, env.apiKey),
      sourceLocale,
      ...(options.locale ? { locale: options.locale } : {}),
      ...(options.catalogs ? { catalogs: options.catalogs } : {}),
      ...(options.sourceCatalog
        ? { sourceCatalog: options.sourceCatalog }
        : {}),
      ...(options.refreshIntervalMs !== undefined
        ? { refreshIntervalMs: options.refreshIntervalMs }
        : {}),
      ...(options.environment ? { environment: options.environment } : {}),
      ...(options.version !== undefined ? { version: options.version } : {}),
    },
  };
}

export function readKeykitEnv(
  env: Record<string, string | undefined>
): KeykitEnv {
  return {
    apiKey: first(env.KEYKIT_API_KEY, env.NEXT_PUBLIC_KEYKIT_API_KEY),
    projectId: first(env.KEYKIT_PROJECT_ID, env.NEXT_PUBLIC_KEYKIT_PROJECT_ID),
    baseUrl: first(env.KEYKIT_BASE_URL, env.NEXT_PUBLIC_KEYKIT_BASE_URL),
    sourceLocale: first(
      env.KEYKIT_SOURCE_LOCALE,
      env.NEXT_PUBLIC_KEYKIT_SOURCE_LOCALE
    ),
  };
}

/** An explicit option wins, including `''`. Env is next. Otherwise `fallback`. */
function pick(
  explicit: string | undefined,
  fromEnv: string | undefined,
  fallback = ''
): string {
  if (explicit !== undefined) {
    return explicit.trim();
  }
  if (fromEnv !== undefined && fromEnv.trim()) {
    return fromEnv.trim();
  }
  return fallback;
}

function first(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}
