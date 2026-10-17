import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { rewriteSourceTree } from '../../packages/cli/src/rewrite';
import {
  executeMergeKeys,
  executeSync,
} from '../../packages/cli/src/sync-command';
import {
  readSyncCheckpoint,
  writeSyncCheckpoint,
} from '../../packages/cli/src/sync-state';

describe('keykit local rewrite CLI', () => {
  it('rewrites quoted translate, isEnabled, and merged keys on disk', () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-rewrite-'));
    try {
      const file = join(root, 'app.tsx');
      writeFileSync(
        file,
        `translate("billing.save", "Save"); isEnabled('newCheckout'); t("feature1.ok", "Okay"); t('feature2.ok', 'Okay');`
      );
      const changed = rewriteSourceTree(root, {
        operations: [
          { type: 'rename-key', fromKey: 'billing.save', toKey: 'common.save' },
          {
            type: 'move-key',
            fromKey: 'newCheckout',
            toKey: 'checkout.enabled',
          },
          {
            type: 'merge-translations',
            fromKey: 'feature1.ok',
            toKey: 'common.ok',
          },
          {
            type: 'merge-translations',
            fromKey: 'feature2.ok',
            toKey: 'common.ok',
          },
        ],
      });
      expect(changed).toBe(1);
      expect(readFileSync(file, 'utf8')).toBe(
        `translate("common.save", "Save"); isEnabled('checkout.enabled'); t("common.ok", "Okay"); t('common.ok', 'Okay');`
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('executeMergeKeys fetches merged keys from backend, rewrites source files, and updates sync-state.json', async () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-merge-cmd-'));
    const directory = join(root, '.keykit');
    try {
      const f1 = join(root, 'feature1.tsx');
      const f2 = join(root, 'feature2.tsx');
      writeFileSync(f1, `export const A = () => t("feature1.ok", "Okay");`);
      writeFileSync(f2, `export const B = () => t('feature2.ok', 'Okay');`);
      writeSyncCheckpoint(directory, {
        version: 1,
        projectId: 'proj_acme',
        synced: {
          'feature1.ok': 'Okay',
          'feature2.ok': 'Okay',
        },
      });

      const mockFetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          merges: [
            { fromKey: 'feature1.ok', toKey: 'common.ok', sourceText: 'Okay' },
            { fromKey: 'feature2.ok', toKey: 'common.ok', sourceText: 'Okay' },
          ],
        }),
      })) as unknown as typeof globalThis.fetch;

      const result = await executeMergeKeys({
        root,
        directory,
        baseUrl: 'https://www.keykit.dev',
        projectId: 'proj_acme',
        token: 'kk_test',
        fetch: mockFetch,
      });

      expect(result.filesChanged).toBe(2);
      expect(readFileSync(f1, 'utf8')).toBe(
        `export const A = () => t("common.ok", "Okay");`
      );
      expect(readFileSync(f2, 'utf8')).toBe(
        `export const B = () => t('common.ok', 'Okay');`
      );
      expect(readSyncCheckpoint(directory, 'proj_acme').synced).toEqual({
        'common.ok': 'Okay',
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('executeSync sends removed keys together with new keys on rename and applies remote merges automatically', async () => {
    const root = mkdtempSync(join(tmpdir(), 'keykit-sync-rename-'));
    const directory = join(root, '.keykit');
    try {
      const inviteFile = join(root, 'AcceptInvitation.tsx');
      const featureFile = join(root, 'Feature1.tsx');
      writeFileSync(
        inviteFile,
        `export const Invite = () => t("invitations.acceptInvite", "Accept invite");`
      );
      writeFileSync(
        featureFile,
        `export const Feature1 = () => t("feature1.ok", "Okay");`
      );

      writeSyncCheckpoint(directory, {
        version: 1,
        projectId: 'proj_acme',
        synced: {
          'accept-invite': 'Accept invite',
          'feature1.ok': 'Okay',
        },
      });

      const requests: Array<{ url: string; method: string; body?: unknown }> =
        [];
      const mockFetch = jest.fn(async (url: string, init?: RequestInit) => {
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        requests.push({
          url,
          method: init?.method ?? 'GET',
          body,
        });
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            createdKeys: 0,
            renamedKeys: [
              {
                fromKey: 'accept-invite',
                toKey: 'invitations.acceptInvite',
              },
            ],
            deprecated: [],
            merges: [
              {
                fromKey: 'feature1.ok',
                toKey: 'common.ok',
                sourceText: 'Okay',
              },
            ],
          }),
        } as Response;
      }) as unknown as typeof globalThis.fetch;

      await executeSync({
        root,
        directory,
        baseUrl: 'https://www.keykit.dev',
        projectId: 'proj_acme',
        token: 'kk_test',
        scan: {},
        chunkSize: 25,
        delayMs: 0,
        interactive: false,
        fetch: mockFetch,
      });

      expect(requests).toHaveLength(1);
      expect(requests[0]?.body).toMatchObject({
        keys: [
          expect.objectContaining({
            key: 'invitations.acceptInvite',
            sourceText: 'Accept invite',
          }),
        ],
        removed: ['accept-invite'],
      });
      expect(readFileSync(featureFile, 'utf8')).toBe(
        `export const Feature1 = () => t("common.ok", "Okay");`
      );
      expect(readSyncCheckpoint(directory, 'proj_acme').synced).toEqual({
        'invitations.acceptInvite': 'Accept invite',
        'common.ok': 'Okay',
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
