import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type TranslationCatalogFile = {
  projectId: string;
  sourceLocale: string;
  environment: string;
  version: string;
  versionNumber: number | null;
  publishedAt: string | null;
  locales: Record<string, Record<string, string>>;
};

export type PullOptions = {
  baseUrl: string;
  projectId: string;
  token: string;
  outDir: string;
  environment?: string;
  version?: number;
  fetch?: typeof fetch;
};

export async function pullTranslationCatalog(
  options: PullOptions
): Promise<TranslationCatalogFile> {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const params = new URLSearchParams();
  if (options.environment && options.environment !== 'production') {
    params.set('environment', options.environment);
  }
  if (options.version) {
    params.set('version', String(options.version));
  }
  const query = params.toString();
  const endpoint =
    `${baseUrl}/api/v1/projects/${encodeURIComponent(options.projectId)}` +
    `/translations${query ? `?${query}` : ''}`;

  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const response = await fetchImpl(endpoint, {
    method: 'GET',
    headers: { Authorization: `Bearer ${options.token}` },
  });

  if (!response.ok) {
    throw new Error(
      `Keykit pull failed (${response.status}): ${await readError(response)}`
    );
  }

  const catalog = (await response.json()) as TranslationCatalogFile;
  if (!catalog?.locales || typeof catalog.locales !== 'object') {
    throw new Error('Keykit pull returned an invalid catalog.');
  }

  const outDir = resolve(options.outDir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, 'catalog.json'),
    `${JSON.stringify(catalog, null, 2)}\n`,
    'utf8'
  );
  for (const [locale, translations] of Object.entries(catalog.locales)) {
    writeFileSync(
      join(outDir, `${locale}.json`),
      `${JSON.stringify(translations, null, 2)}\n`,
      'utf8'
    );
  }

  return catalog;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === 'string') {
      return body.error;
    }
  } catch {
    // Fall through to status text for non-JSON responses.
  }
  return response.statusText || 'Unknown error';
}
