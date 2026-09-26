#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveKeykitSetup } from '@keykithq/sdk/project-config';
import { pullTranslationCatalog } from './pull';
import { rewriteSourceTree, type RewritePlan } from './rewrite';
import { scanSourceTree } from './scan';

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
      baseUrl: requiredSetting(
        args,
        '--base-url',
        setup.config.baseUrl,
        'KEYKIT_BASE_URL'
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

  if (command === 'scan') {
    const root = argValue(args, '--root') ?? process.cwd();
    const keys = scanSourceTree(resolve(root));
    console.log(JSON.stringify(keys, null, 2));
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
  scan --root .
  pull [--out .keykit] [--base-url URL] [--project-id ID] [--token KEY]
  rewrite --file migration.json --root .
  flatten-json --file messages.json

pull writes .keykit/catalog.json plus one JSON file per locale for
@keykithq/sdk static delivery. It reads keykit.config.ts when present.
Flags override the environment, which overrides the config file.
Credentials can also come from KEYKIT_BASE_URL, KEYKIT_PROJECT_ID, and
KEYKIT_API_KEY.

The backend never writes customer filesystems. Apply Keykit migrations
locally, then commit the result.`);
}

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
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
