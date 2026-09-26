import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { defineKeykitConfig } from './define-config';
import {
  clearKeykitProjectConfigCache,
  resolveKeykitSetup,
} from './project-config';

afterEach(() => {
  clearKeykitProjectConfigCache();
});

describe('resolveKeykitSetup', () => {
  it('loads keykit.config.ts and catalogs from .keykit', async () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-config-'));
    writeFileSync(
      join(root, 'keykit.config.ts'),
      `export default ${JSON.stringify(
        defineKeykitConfig({
          delivery: 'static',
          locales: ['en', 'sv'],
          defaultLocale: 'en',
        })
      )};\n`,
      'utf8'
    );
    mkdirSync(join(root, '.keykit'));
    writeFileSync(
      join(root, '.keykit', 'catalog.json'),
      `${JSON.stringify({
        projectId: 'proj_acme',
        sourceLocale: 'en',
        locales: {
          en: { 'settings.save': 'Save' },
          sv: { 'settings.save': 'Spara' },
        },
      })}\n`,
      'utf8'
    );

    const setup = await resolveKeykitSetup({}, join(root, 'app'));

    expect(setup.configFile).toBe(join(root, 'keykit.config.ts'));
    expect(setup.directory).toBe(join(root, '.keykit'));
    expect(setup.config).toMatchObject({
      delivery: 'static',
      locales: ['en', 'sv'],
      projectId: 'proj_acme',
      sourceLocale: 'en',
      sourceCatalog: { 'settings.save': 'Save' },
      catalogs: {
        sv: { 'settings.save': 'Spara' },
      },
    });
  });

  it('lets explicit options override the config file', async () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-config-'));
    writeFileSync(
      join(root, 'keykit.config.mjs'),
      'export default { locales: ["sv"], cookieName: "from-file" };\n',
      'utf8'
    );

    const setup = await resolveKeykitSetup(
      { locales: ['en'], delivery: 'live' },
      root
    );

    expect(setup.config.locales).toEqual(['en']);
    expect(setup.config.cookieName).toBe('from-file');
    expect(setup.config.delivery).toBe('live');
  });

  it('reads .keykit/catalog.json when there is no config file', async () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-catalog-'));
    mkdirSync(join(root, '.keykit'));
    writeFileSync(
      join(root, '.keykit', 'catalog.json'),
      JSON.stringify({
        sourceLocale: 'en',
        locales: { en: { hello: 'Hello' } },
      }),
      'utf8'
    );

    const setup = await resolveKeykitSetup({}, root);

    expect(setup.configFile).toBeNull();
    expect(setup.config.catalogs).toEqual({ en: { hello: 'Hello' } });
    expect(setup.config.sourceCatalog).toEqual({ hello: 'Hello' });
  });
});
