#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveKeykitSetup } from '@keykithq/sdk/project-config';
import { pullTranslationCatalog } from './pull';
import { rewriteSourceTree, type RewritePlan } from './rewrite';
import { scanSourceTree } from './scan';
import {
  DEFAULT_CHUNK_DELAY_MS,
  DEFAULT_CHUNK_SIZE,
  executeSync,
  resolveScanOptions,
} from './sync-command';
import { normalizeChunkSize } from './sync-batch';
import { loadProjectEnv, resolveBaseUrl } from './load-env';

function flatten(
  value: unknown,
  prefix = '',
  out: Array<{ key: string; sourceText: string }> = []
) {
  if (typeof value === 'string') {
    if (prefix) {
      out.push({ key: prefix, sourceText: value });
    }
    return out;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return out;
  }
  for (const [name, nested] of Object.entries(value)) {
    flatten(nested, prefix ? `${prefix}.${name}` : name, out);
  }
  return out;
}

async function main() {
  const [, , command, ...args] = process.argv;
  loadProjectEnv(argValue(args, '--root') ?? process.cwd());
  if (command === 'rewrite') {
    const file = argValue(args, '--file');
    const root = argValue(args, '--root') ?? process.cwd();
    if (!file) {
      throw new Error('Usage: keykit rewrite --file migration.json --root .');
    }
    const plan = JSON.parse(readFileSync(resolve(file), 'utf8')) as RewritePlan;
    const changed = rewriteSourceTree(resolve(root), plan);
    console.log(
      `Rewrote ${changed} file(s). Upload completion in the Keykit migrations UI.`
    );
    return;
  }

  if (command === 'pull') {
    const setup = await resolveKeykitSetup();
    const outDir = argValue(args, '--out') ?? setup.directory;
    const catalog = await pullTranslationCatalog({
      baseUrl: resolveBaseUrl(
        argValue(args, '--base-url'),
        process.env.KEYKIT_BASE_URL,
        setup.config.baseUrl
      ),
      projectId: requiredSetting(
        args,
        '--project-id',
        setup.config.projectId,
        'KEYKIT_PROJECT_ID'
      ),
      token: requiredSetting(
        args,
        '--token',
        setup.config.apiKey ?? setup.config.ingestToken,
        'KEYKIT_API_KEY'
      ),
      outDir,
      environment:
        argValue(args, '--environment') ??
        setup.config.environment ??
        process.env.KEYKIT_ENVIRONMENT,
      version: parseOptionalVersion(
        argValue(args, '--version') ??
          (setup.config.version !== undefined
            ? String(setup.config.version)
            : undefined)
      ),
    });
    const locales = Object.keys(catalog.locales);
    console.log(
      `Wrote ${locales.length} locale file(s) plus catalog.json to ${outDir} ` +
        `(${locales.join(', ') || 'none'}).`
    );
    return;
  }

  if (command === 'scan' || command === 'sync') {
    const requestedRoot = argValue(args, '--root');
    const setup = await resolveKeykitSetup(
      {},
      requestedRoot ? resolve(requestedRoot) : process.cwd()
    );
    const root = resolve(requestedRoot ?? setup.root);
    const scanOptions = resolveScanOptions(
      root === resolve(setup.root) ? setup.config : {},
      argValues(args, '--include'),
      argValues(args, '--exclude')
    );
    if (command === 'scan') {
      const keys = scanSourceTree(root, scanOptions);
      console.log(JSON.stringify(keys, null, 2));
      return;
    }

    const chunkSize = normalizeChunkSize(
      parsePositiveInteger(argValue(args, '--chunk'), DEFAULT_CHUNK_SIZE, '--chunk')
    );
    const delayMs = parseNonNegativeInteger(
      argValue(args, '--delay'),
      DEFAULT_CHUNK_DELAY_MS,
      '--delay'
    );
    await executeSync({
      root,
      directory: setup.directory,
      baseUrl: resolveBaseUrl(
        argValue(args, '--base-url'),
        process.env.KEYKIT_BASE_URL,
        setup.config.baseUrl
      ),
      projectId: requiredSetting(
        args,
        '--project-id',
        setup.config.projectId,
        'KEYKIT_PROJECT_ID'
      ),
      token: requiredSetting(
        args,
        '--token',
        setup.config.apiKey ?? setup.config.ingestToken,
        'KEYKIT_API_KEY'
      ),
      environment:
        argValue(args, '--environment') ??
        setup.config.environment ??
        process.env.KEYKIT_ENVIRONMENT,
      scan: scanOptions,
      chunkSize,
      delayMs,
    });
    return;
  }

  if (command === 'flatten-json') {
    const file = argValue(args, '--file');
    if (!file) {
      throw new Error('Usage: keykit flatten-json --file messages.json');
    }
    const parsed = JSON.parse(readFileSync(resolve(file), 'utf8')) as unknown;
    console.log(JSON.stringify(flatten(parsed), null, 2));
    return;
  }

  console.log(`Keykit CLI
  scan [--root .] [--include path] [--exclude path]
  sync [--root .] [--include path] [--exclude path] [--chunk 25] [--delay 200]
  pull [--out .keykit] [--base-url URL] [--project-id ID] [--token KEY]
  rewrite --file migration.json --root .
  flatten-json --file messages.json

sync uploads t() and translate() calls while you are developing.
It sends them in chunks (25 keys per request by default) and waits
between requests. In a terminal, p pauses, c continues, and q saves
progress so the next sync continues. Page views do not upload keys.

scan and sync read scan.include and scan.exclude from keykit.config.ts.
Repeat --include or --exclude, or pass a comma-separated list.
Omit them to scan the whole project. node_modules, dist, .next, and
other build folders are always skipped.

Progress is stored in .keykit/sync-state.json. That file is local;
do not commit it.

pull writes .keykit/catalog.json plus one JSON file per locale for
@keykithq/sdk static delivery. It reads keykit.config.ts when present.
Flags override the environment, which overrides the config file.
The API is https://www.keykit.dev. Set KEYKIT_BASE_URL or --base-url
only to point at another host. KEYKIT_PROJECT_ID and KEYKIT_API_KEY
come from the environment, .env, .env.local, or keykit.config.

The backend never writes customer filesystems. Apply Keykit migrations
locally, then commit the result.`);
}

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function argValues(args: string[], name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== name) {
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      continue;
    }
    for (const part of value.split(',')) {
      const trimmed = part.trim();
      if (trimmed) {
        values.push(trimmed);
      }
    }
  }
  return values;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  flag: string
): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

function parseNonNegativeInteger(
  value: string | undefined,
  fallback: number,
  flag: string
): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer.`);
  }
  return parsed;
}

function requiredSetting(
  args: string[],
  flag: string,
  fromConfig: string | undefined,
  envName: string
): string {
  const value = argValue(args, flag) ?? process.env[envName] ?? fromConfig;
  if (!value?.trim()) {
    throw new Error(
      `Missing ${flag} (or ${envName} in the environment or keykit.config).`
    );
  }
  return value.trim();
}

function parseOptionalVersion(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('--version must be a positive integer.');
  }
  return parsed;
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
