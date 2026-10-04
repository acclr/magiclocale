import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** Public Keykit API. Customers do not set a host. */
export const KEYKIT_DEFAULT_BASE_URL = 'https://www.keykit.dev';

const CONFIG_NAMES = [
  'keykit.config.ts',
  'keykit.config.mts',
  'keykit.config.js',
  'keykit.config.mjs',
  'keykit.config.cjs',
  'keykit.config.json',
];

/**
 * Reads `.env` and `.env.local` into `process.env` before `keykit.config` loads.
 * Already-set variables win. `.env.local` wins over `.env`.
 */
export function loadProjectEnv(start = process.cwd()): void {
  const dir = projectRoot(start);
  const values = {
    ...parseEnvFile(join(dir, '.env')),
    ...parseEnvFile(join(dir, '.env.local')),
  };
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function resolveBaseUrl(
  flag: string | undefined,
  fromEnv: string | undefined,
  fromConfig: string | undefined
): string {
  const value = [flag, fromEnv, fromConfig].find((entry) => entry?.trim());
  return value?.trim() || KEYKIT_DEFAULT_BASE_URL;
}

export function parseEnvFile(file: string): Record<string, string> {
  if (!existsSync(file)) {
    return {};
  }
  const values: Record<string, string> = {};
  const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const body = trimmed.startsWith('export ')
      ? trimmed.slice('export '.length).trim()
      : trimmed;
    const separator = body.indexOf('=');
    if (separator <= 0) {
      continue;
    }
    const key = body.slice(0, separator).trim();
    const value = unquote(body.slice(separator + 1).trim());
    if (key) {
      values[key] = value;
    }
  }
  return values;
}

function projectRoot(start: string): string {
  let dir = resolve(start);
  for (;;) {
    if (
      existsSync(join(dir, 'package.json')) ||
      existsSync(join(dir, '.env')) ||
      existsSync(join(dir, '.env.local')) ||
      CONFIG_NAMES.some((name) => existsSync(join(dir, name)))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return resolve(start);
    }
    dir = parent;
  }
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    return value.slice(1, -1);
  }
  return value;
}
