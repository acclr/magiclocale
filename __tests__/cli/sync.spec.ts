import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  chunkItems,
  pendingKeys,
  runChunkedSync,
  toIngestKey,
} from '../../packages/cli/src/sync-batch';
import { readSyncCheckpoint, writeSyncCheckpoint } from '../../packages/cli/src/sync-state';
import { formatSyncFrame } from '../../packages/cli/src/sync-ui';
import type { ScannedSourceKey } from '../../packages/cli/src/scan';

const keys: ScannedSourceKey[] = [
  { key: 'a', sourceText: 'A', file: join('app', 'a.tsx'), line: 1 },
  { key: 'b', sourceText: 'B', file: join('app', 'b.tsx'), line: 2 },
  { key: 'c', sourceText: 'C', file: join('app', 'c.tsx'), line: 3 },
  { key: 'd', sourceText: 'D', file: join('app', 'd.tsx'), line: 4 },
];

describe('keykit sync batches', () => {
  it('splits keys into bounded chunks', () => {
    expect(chunkItems(keys, 3)).toEqual([keys.slice(0, 3), keys.slice(3)]);
    expect(() => chunkItems(keys, 101)).toThrow(/100/);
  });

  it('skips keys whose source text is already synced', () => {
    expect(pendingKeys(keys, { a: 'A', b: 'Old' }).map((item) => item.key)).toEqual([
      'b',
      'c',
      'd',
    ]);
  });

  it('sends one request per chunk and stops before the next chunk when aborted', async () => {
    const batches: string[][] = [];
    let paused = false;
    const result = await runChunkedSync({
      keys,
      root: process.cwd(),
      chunkSize: 2,
      delayMs: 0,
      push: async (batch) => {
        batches.push(batch.map((item) => item.key));
        paused = true;
      },
      control: {
        isAborted: () => paused,
        waitIfPaused: async () => (paused ? 'abort' : 'continue'),
      },
      sleep: async () => undefined,
    });

    expect(batches).toEqual([['a', 'b']]);
    expect(result).toMatchObject({
      sent: 2,
      stopped: 'aborted',
      synced: { a: 'A', b: 'B' },
    });
  });

  it('keeps completed chunks when a later request fails', async () => {
    const result = await runChunkedSync({
      keys,
      root: process.cwd(),
      chunkSize: 2,
      delayMs: 0,
      push: async (batch) => {
        if (batch.some((item) => item.key === 'c')) {
          throw new Error('offline');
        }
      },
      sleep: async () => undefined,
    });

    expect(result.stopped).toBe('error');
    expect(result.sent).toBe(2);
    expect(result.synced).toEqual({ a: 'A', b: 'B' });
    expect(result.error?.message).toBe('offline');
  });

  it('sends usage paths relative to the project root', () => {
    const root = join('C:\\work', 'demo');
    const item: ScannedSourceKey = {
      key: 'home.title',
      sourceText: 'Welcome',
      file: join(root, 'app', 'page.tsx'),
      line: 8,
    };
    expect(toIngestKey(item, root)).toEqual({
      key: 'home.title',
      sourceText: 'Welcome',
      type: 'translation',
      usage: { file: 'app/page.tsx', line: 8 },
    });
  });

  it('remembers synced source text so a later run can continue', () => {
    const directory = mkdtempSync(join(tmpdir(), 'keykit-sync-'));
    writeSyncCheckpoint(directory, {
      version: 1,
      projectId: 'proj_acme',
      synced: { a: 'A' },
    });

    expect(readSyncCheckpoint(directory, 'proj_acme').synced).toEqual({ a: 'A' });
    expect(readSyncCheckpoint(directory, 'proj_other').synced).toEqual({});
    expect(JSON.parse(readFileSync(join(directory, 'sync-state.json'), 'utf8')).projectId).toBe(
      'proj_acme'
    );
  });

  it('renders a progress frame with the chunk size', () => {
    const text = formatSyncFrame({
      projectId: 'proj_acme',
      scope: 'app',
      sent: 25,
      total: 80,
      chunkIndex: 1,
      chunkCount: 4,
      chunkSize: 25,
      status: 'syncing',
      preview: ['home.title'],
    });

    expect(text).toContain('25/80');
    expect(text).toContain('25 per request');
    expect(text).toContain('4 requests');
    expect(text).toContain('p pause');
    expect(text).toContain('home.title');
  });
});
