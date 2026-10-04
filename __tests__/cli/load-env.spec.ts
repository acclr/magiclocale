import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  KEYKIT_DEFAULT_BASE_URL,
  loadProjectEnv,
  parseEnvFile,
  resolveBaseUrl,
} from '../../packages/cli/src/load-env';

describe('keykit env files', () => {
  it('reads quoted values and lets .env.local override .env', () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-env-'));
    writeFileSync(
      join(root, '.env'),
      'KEYKIT_PROJECT_ID="from-env"\nKEYKIT_API_KEY="key"\n# comment\n'
    );
    writeFileSync(
      join(root, '.env.local'),
      "KEYKIT_PROJECT_ID='from-local'\nexport KEYKIT_BASE_URL=\"http://localhost:4002\"\n"
    );
    writeFileSync(join(root, 'package.json'), '{}');

    const previousProject = process.env.KEYKIT_PROJECT_ID;
    const previousKey = process.env.KEYKIT_API_KEY;
    const previousBase = process.env.KEYKIT_BASE_URL;
    delete process.env.KEYKIT_PROJECT_ID;
    delete process.env.KEYKIT_API_KEY;
    delete process.env.KEYKIT_BASE_URL;

    try {
      loadProjectEnv(root);
      expect(process.env.KEYKIT_PROJECT_ID).toBe('from-local');
      expect(process.env.KEYKIT_API_KEY).toBe('key');
      expect(process.env.KEYKIT_BASE_URL).toBe('http://localhost:4002');
    } finally {
      restore('KEYKIT_PROJECT_ID', previousProject);
      restore('KEYKIT_API_KEY', previousKey);
      restore('KEYKIT_BASE_URL', previousBase);
    }

    expect(parseEnvFile(join(root, 'missing.env'))).toEqual({});
  });

  it('uses keykit.dev unless a host is set', () => {
    expect(resolveBaseUrl(undefined, undefined, undefined)).toBe(
      KEYKIT_DEFAULT_BASE_URL
    );
    expect(resolveBaseUrl(undefined, '  ', '')).toBe(KEYKIT_DEFAULT_BASE_URL);
    expect(resolveBaseUrl(undefined, 'http://localhost:4002', undefined)).toBe(
      'http://localhost:4002'
    );
    expect(
      resolveBaseUrl('https://example.test', 'http://localhost:4002', undefined)
    ).toBe('https://example.test');
  });
});

function restore(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
