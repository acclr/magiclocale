import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { pullTranslationCatalog } from '../../packages/cli/src/pull';

describe('keykit pull', () => {
  it('writes catalog.json and one file per locale', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'keykit-pull-'));
    const catalog = {
      projectId: 'proj_acme',
      sourceLocale: 'en',
      environment: 'production',
      version: '3',
      versionNumber: 3,
      publishedAt: '2026-09-25T00:00:00.000Z',
      locales: {
        en: { 'settings.save': 'Save' },
        sv: { 'settings.save': 'Spara' },
      },
    };
    const fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => catalog,
    }));

    await pullTranslationCatalog({
      baseUrl: 'https://www.keykit.dev/',
      projectId: 'proj_acme',
      token: 'secret',
      outDir,
      fetch: fetch as unknown as typeof globalThis.fetch,
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://www.keykit.dev/api/v1/projects/proj_acme/translations',
      expect.objectContaining({
        headers: { Authorization: 'Bearer secret' },
      })
    );
    expect(
      JSON.parse(readFileSync(join(outDir, 'catalog.json'), 'utf8'))
    ).toEqual(catalog);
    expect(JSON.parse(readFileSync(join(outDir, 'sv.json'), 'utf8'))).toEqual({
      'settings.save': 'Spara',
    });
  });
});
