import type { KeykitConfig, ResolvedKeykitConfig } from './types';

export function resolveConfig(
  config: KeykitConfig
): ResolvedKeykitConfig {
  assertNonEmpty(config.baseUrl, 'baseUrl');
  assertNonEmpty(config.projectId, 'projectId');
  assertNonEmpty(config.ingestToken, 'ingestToken');
  const sourceLocale = config.sourceLocale ?? 'en';
  const locale = config.locale ?? sourceLocale;
  assertNonEmpty(sourceLocale, 'sourceLocale');
  assertNonEmpty(locale, 'locale');

  const fetchImplementation =
    config.fetch ?? globalThis.fetch?.bind(globalThis);
  if (!fetchImplementation) {
    throw new Error(
      'Keykit requires a fetch implementation in this runtime.'
    );
  }

  return {
    baseUrl: config.baseUrl.replace(/\/+$/, ''),
    projectId: config.projectId,
    ingestToken: config.ingestToken,
    sourceLocale,
    locale,
    environment: (config.environment ?? 'production').trim() || 'production',
    version: config.version ?? null,
    context: config.context ?? {},
    initialBundle: config.initialBundle,
    initialFlags: config.initialFlags,
    refreshIntervalMs: nonNegativeInteger(
      config.refreshIntervalMs,
      30_000,
      'refreshIntervalMs'
    ),
    debounceMs: positiveInteger(config.debounceMs, 250, 'debounceMs'),
    batchSize: positiveInteger(config.batchSize, 100, 'batchSize'),
    maxRetries: nonNegativeInteger(config.maxRetries, 2, 'maxRetries'),
    retryDelayMs: positiveInteger(config.retryDelayMs, 250, 'retryDelayMs'),
    fetch: fetchImplementation,
    onError:
      config.onError ??
      ((error) => {
        console.warn('[Keykit]', error.message);
      }),
    sourceCatalog: config.sourceCatalog,
  };
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
