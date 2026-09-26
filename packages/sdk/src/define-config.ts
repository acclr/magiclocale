import type { KeykitLoadResult } from './pages-request';
import type { KeykitDelivery, LocaleCatalogs } from './types';

/** Pulled catalogs and other Keykit files live here, next to `keykit.config`. */
export const KEYKIT_DIRECTORY = '.keykit';

export const KEYKIT_CONFIG_FILES = [
  'keykit.config.ts',
  'keykit.config.mts',
  'keykit.config.js',
  'keykit.config.mjs',
  'keykit.config.cjs',
  'keykit.config.json',
] as const;

/**
 * Options from `keykit.config.ts` (or `.js` / `.mjs` / `.cjs` / `.json`).
 * Secrets can stay in `KEYKIT_API_KEY`, `KEYKIT_PROJECT_ID`, and `KEYKIT_BASE_URL`.
 */
export type KeykitProjectConfig = {
  /** Defaults to `KEYKIT_API_KEY`. */
  apiKey?: string;
  /** Alias of `apiKey` used by the programmatic client config. */
  ingestToken?: string;
  /** Defaults to `KEYKIT_PROJECT_ID`. */
  projectId?: string;
  /** Defaults to `KEYKIT_BASE_URL`. */
  baseUrl?: string;
  sourceLocale?: string;
  locale?: string;
  defaultLocale?: string;
  locales?: readonly string[];
  delivery?: KeykitDelivery;
  environment?: string;
  version?: number;
  cookieName?: string;
  refreshIntervalMs?: number;
  catalogs?: LocaleCatalogs;
  sourceCatalog?: Record<string, string>;
  /** Folder for `keykit pull`. Defaults to `.keykit`. */
  dir?: string;
  /** Pages Router: read the locale from the URL (`/`, `/en`, `/sv`). */
  routing?: 'path';
  pages?: readonly string[];
  pathParam?: string;
  load?: (locale: string) => Promise<KeykitLoadResult>;
};

export function defineKeykitConfig(
  config: KeykitProjectConfig
): KeykitProjectConfig {
  return config;
}
