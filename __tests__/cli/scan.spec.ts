import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanSourceTree } from '../../packages/cli/src/scan';

describe('keykit scan', () => {
  it('finds translate and t calls in source files', () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-scan-'));
    writeFileSync(
      join(root, 'App.tsx'),
      `const x = translate("billing.save", "Save");\nconst y = t('nav.home', 'Home');\n`
    );

    const keys = scanSourceTree(root);
    expect(keys).toEqual([
      {
        key: 'billing.save',
        sourceText: 'Save',
        file: join(root, 'App.tsx'),
        line: 1,
      },
      {
        key: 'nav.home',
        sourceText: 'Home',
        file: join(root, 'App.tsx'),
        line: 2,
      },
    ]);
  });

  it('limits the scan to included paths and skips excluded directories', () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-scan-'));
    mkdirSync(join(root, 'app'));
    mkdirSync(join(root, 'legacy'));
    mkdirSync(join(root, 'node_modules', 'pkg'), { recursive: true });
    writeFileSync(
      join(root, 'app', 'Page.tsx'),
      `t('home.title', 'Welcome');\n`
    );
    writeFileSync(
      join(root, 'legacy', 'Old.tsx'),
      `t('legacy.title', 'Old');\n`
    );
    writeFileSync(
      join(root, 'node_modules', 'pkg', 'index.js'),
      `t('vendor.title', 'Vendor');\n`
    );

    expect(scanSourceTree(root, { include: ['app'] }).map((item) => item.key)).toEqual([
      'home.title',
    ]);
    expect(
      scanSourceTree(root, { exclude: ['legacy'] }).map((item) => item.key)
    ).toEqual(['home.title']);
  });
});
