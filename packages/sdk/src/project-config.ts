import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createJiti, type Jiti } from 'jiti';
import { catalogsFromFile } from './config';
import type { CreateKeykitOptions } from './create-keykit';
import {
  KEYKIT_CONFIG_FILES,
  KEYKIT_DIRECTORY,
  type KeykitProjectConfig,
} from './define-config';
import type { KeykitCatalogFile } from './types';

export type ResolvedKeykitSetup = {
  /** Directory that contains `keykit.config`, or `cwd` when there is no file. */
  root: string;
  /** Absolute path to the catalog folder (`.keykit` by default). */
  directory: string;
  configFile: string | null;
  config: KeykitProjectConfig;
};

const parsedFiles = new Map<
  string,
  { mtimeMs: number; config: KeykitProjectConfig }
>();

let jiti: Jiti | null = null;

export function clearKeykitProjectConfigCache(): void {
  parsedFiles.clear();
  jiti = null;
}

export function findKeykitConfigFile(
  start = process.cwd()
): { file: string; root: string } | null {
  let dir = resolve(start);
  for (;;) {
    for (const name of KEYKIT_CONFIG_FILES) {
      const candidate = join(dir, name);
      if (existsSync(candidate)) {
        return { file: candidate, root: dir };
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/**
 * Loads `keykit.config.*` from `cwd` (walking up to the nearest file) and fills
 * catalogs from `.keykit/catalog.json` when the config does not set them.
 * Explicit fields win over the file, which wins over the catalog.
 */
export async function resolveKeykitSetup(
  explicit: KeykitProjectConfig = {},
  cwd = process.cwd()
): Promise<ResolvedKeykitSetup> {
  const found = findKeykitConfigFile(cwd);
  const fileConfig = found ? await readConfigFile(found.file) : {};
  const root = found?.root ?? resolve(cwd);
  const directory = resolve(
    root,
    explicit.dir ?? fileConfig.dir ?? KEYKIT_DIRECTORY
  );
  const config: KeykitProjectConfig = {
    ...omitUndefined(fileConfig),
    ...omitUndefined(explicit),
  };

  if (!config.catalogs) {
    applyCatalog(config, directory);
  }

  return {
    root,
    directory,
    configFile: found?.file ?? null,
    config,
  };
}

export function toCreateKeykitOptions(
  config: KeykitProjectConfig
): CreateKeykitOptions {
  const apiKey = config.apiKey ?? config.ingestToken;
  return omitUndefined({
    apiKey,
    projectId: config.projectId,
    baseUrl: config.baseUrl,
    sourceLocale: config.sourceLocale,
    locale: config.locale,
    delivery: config.delivery,
    catalogs: config.catalogs,
    sourceCatalog: config.sourceCatalog,
    refreshIntervalMs: config.refreshIntervalMs,
    environment: config.environment,
    version: config.version,
  });
}

async function readConfigFile(file: string): Promise<KeykitProjectConfig> {
  const mtimeMs = statSync(file).mtimeMs;
  const cached = parsedFiles.get(file);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.config;
  }

  let loaded: unknown;
  try {
    loaded = await getJiti().import(file, { default: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not load ${file}. ${message}`, { cause: error });
  }

  if (!loaded || typeof loaded !== 'object' || Array.isArray(loaded)) {
    throw new Error(
      `Keykit config ${file} must export an object. Use export default defineKeykitConfig({ ... }).`
    );
  }

  const config = loaded as KeykitProjectConfig;
  parsedFiles.set(file, { mtimeMs, config });
  return config;
}

function applyCatalog(config: KeykitProjectConfig, directory: string): void {
  const file = join(directory, 'catalog.json');
  if (!existsSync(file)) {
    return;
  }

  let parsed: KeykitCatalogFile;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8')) as KeykitCatalogFile;
    config.catalogs = catalogsFromFile(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read ${file}. ${message}`, { cause: error });
  }

  if (!config.sourceLocale && parsed.sourceLocale) {
    config.sourceLocale = parsed.sourceLocale;
  }
  if (!config.projectId && parsed.projectId) {
    config.projectId = parsed.projectId;
  }
  if (!config.environment && parsed.environment) {
    config.environment = parsed.environment;
  }
  const sourceLocale = config.sourceLocale;
  if (
    !config.sourceCatalog &&
    sourceLocale &&
    config.catalogs?.[sourceLocale]
  ) {
    config.sourceCatalog = config.catalogs[sourceLocale];
  }
}

function getJiti(): Jiti {
  if (!jiti) {
    jiti = createJiti(import.meta.url, {
      moduleCache: false,
      fsCache: false,
    });
  }
  return jiti;
}

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}
