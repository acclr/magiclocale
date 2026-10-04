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
        variables: [],
        file: join(root, 'App.tsx'),
        line: 1,
      },
      {
        key: 'nav.home',
        sourceText: 'Home',
        variables: [],
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

    expect(
      scanSourceTree(root, { include: ['app'] }).map((item) => item.key)
    ).toEqual(['home.title']);
    expect(
      scanSourceTree(root, { exclude: ['legacy'] }).map((item) => item.key)
    ).toEqual(['home.title']);
  });

  it('finds t calls whose arguments wrap across lines', () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-scan-'));
    writeFileSync(
      join(root, 'page.tsx'),
      [
        't("home.docs", "Documentation");',
        't(',
        '  "home.intro",',
        '  "Looking for a starting point or more instructions? Head over to",',
        ');',
        '',
      ].join('\n')
    );

    expect(scanSourceTree(root)).toEqual([
      {
        key: 'home.docs',
        sourceText: 'Documentation',
        variables: [],
        file: join(root, 'page.tsx'),
        line: 1,
      },
      {
        key: 'home.intro',
        sourceText:
          'Looking for a starting point or more instructions? Head over to',
        variables: [],
        file: join(root, 'page.tsx'),
        line: 2,
      },
    ]);
  });

  it('keeps placeholder slots when the call passes a JSX value', () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-scan-'));
    writeFileSync(
      join(root, 'page.tsx'),
      [
        't(',
        '  "home.heading",',
        '  "Start with editing the {fileName} file",',
        '  {',
        '    fileName: (',
        '      <code className="rounded">page.tsx</code>',
        '    ),',
        '  },',
        ')',
        '',
      ].join('\n')
    );

    expect(scanSourceTree(root)).toEqual([
      {
        key: 'home.heading',
        sourceText: 'Start with editing the {fileName} file',
        variables: ['fileName'],
        file: join(root, 'page.tsx'),
        line: 1,
      },
    ]);
  });
});
