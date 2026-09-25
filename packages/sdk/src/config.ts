import type {
  KeykitCatalogFile,
  KeykitConfig,
  KeykitDelivery,
  LocaleCatalogs,
  ResolvedKeykitConfig,
} from './types';

export function resolveConfig(config: KeykitConfig): ResolvedKeykitConfig {
  const catalogs = config.catalogs ?? {};
  const hasCatalogs = Object.keys(catalogs).length > 0;
  const delivery = resolveDelivery(config, hasCatalogs);
  const sourceLocale = config.sourceLocale ?? 'en';
  const locale = config.locale ?? sourceLocale;
  assertNonEmpty(sourceLocale, 'sourceLocale');
  assertNonEmpty(locale, 'locale');

  const canIngest = Boolean(
    config.baseUrl?.trim() &&
      config.projectId?.trim() &&
      config.ingestToken?.trim()
  );
  const canPull = delivery === 'live';

  if (delivery === 'live') {
    assertNonEmpty(config.baseUrl ?? '', 'baseUrl');
    assertNonEmpty(config.projectId ?? '', 'projectId');
    assertNonEmpty(config.ingestToken ?? '', 'ingestToken');
  } else if (!hasCatalogs) {
    throw new Error(
      'Keykit static delivery requires catalogs from `keykit pull` or locale JSON files.'
    );
  }

  const fetchImplementation =
    config.fetch ?? globalThis.fetch?.bind(globalThis);
  if ((canIngest || canPull) && !fetchImplementation) {
    throw new Error(
      'Keykit requires a fetch implementation in this runtime.'
    );
  }

  return {
    delivery,
    baseUrl: (config.baseUrl ?? '').replace(/\/+$/, ''),
    projectId: config.projectId ?? '',
    ingestToken: config.ingestToken ?? '',
    sourceLocale,
    locale,
    environment: (config.environment ?? 'production').trim() || 'production',
    version: config.version ?? null,
    context: config.context ?? {},
    initialBundle: config.initialBundle,
    initialFlags: config.initialFlags,
    catalogs,
    refreshIntervalMs: nonNegativeInteger(
      config.refreshIntervalMs,
      canPull ? 30_000 : 0,
      'refreshIntervalMs'
    ),
    debounceMs: positiveInteger(config.debounceMs, 250, 'debounceMs'),
    batchSize: positiveInteger(config.batchSize, 100, 'batchSize'),
    maxRetries: nonNegativeInteger(config.maxRetries, 2, 'maxRetries'),
    retryDelayMs: positiveInteger(config.retryDelayMs, 250, 'retryDelayMs'),
    fetch: fetchImplementation ?? (async () => {
      throw new Error('Keykit fetch is not available in this runtime.');
    }),
    onError:
      config.onError ??
      ((error) => {
        console.warn('[Keykit]', error.message);
      }),
    sourceCatalog: config.sourceCatalog,
    canIngest,
    canPull,
  };
}

export function catalogsFromFile(file: KeykitCatalogFile): LocaleCatalogs {
  if (!file?.locales || typeof file.locales !== 'object') {
    throw new Error('Keykit catalog file is missing a locales map.');
  }
  return file.locales;
}

function resolveDelivery(
  config: KeykitConfig,
  hasCatalogs: boolean
): KeykitDelivery {
  if (config.delivery) {
    return config.delivery;
  }
  if (hasCatalogs && !config.ingestToken?.trim()) {
    return 'static';
  }
  return 'live';
}

function assertNonEmpty(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`Keykit ${name} must not be empty.`);
  }
}

function positiveInteger(
  value: number | undefined,
  fallback: number,
  name: string
): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved <= 0) {
    throw new Error(`Keykit ${name} must be a positive integer.`);
  }
  return resolved;
}

function nonNegativeInteger(
  value: number | undefined,
  fallback: number,
  name: string
): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < 0) {
    throw new Error(`Keykit ${name} must be a non-negative integer.`);
  }
  return resolved;
}
