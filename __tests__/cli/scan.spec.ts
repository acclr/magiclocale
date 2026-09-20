import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

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
});
