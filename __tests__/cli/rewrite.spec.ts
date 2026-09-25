import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { rewriteSourceTree } from '../../packages/cli/src/rewrite';

describe('keykit local rewrite CLI', () => {
  it('rewrites quoted translate and isEnabled keys on disk', () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-rewrite-'));
    try {
      const file = join(root, 'app.tsx');
      writeFileSync(
        file,
        `translate("billing.save", "Save"); isEnabled('newCheckout');`
      );
      const changed = rewriteSourceTree(root, {
        operations: [
          { type: 'rename-key', fromKey: 'billing.save', toKey: 'common.save' },
          {
            type: 'move-key',
            fromKey: 'newCheckout',
            toKey: 'checkout.enabled',
          },
        ],
      });
      expect(changed).toBe(1);
      expect(readFileSync(file, 'utf8')).toBe(
        `translate("common.save", "Save"); isEnabled('checkout.enabled');`
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
