import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SyncCheckpoint } from './sync-batch';

const FILE_NAME = 'sync-state.json';

export function syncStatePath(directory: string): string {
  return join(directory, FILE_NAME);
}

export function readSyncCheckpoint(
  directory: string,
  projectId: string
): SyncCheckpoint {
  const empty: SyncCheckpoint = { version: 1, projectId, synced: {} };
  try {
    const parsed = JSON.parse(readFileSync(syncStatePath(directory), 'utf8')) as SyncCheckpoint;
    if (parsed?.version !== 1 || parsed.projectId !== projectId) {
      return empty;
    }
    if (!parsed.synced || typeof parsed.synced !== 'object') {
      return empty;
    }
    return { version: 1, projectId, synced: parsed.synced };
  } catch {
    return empty;
  }
}

export function writeSyncCheckpoint(
  directory: string,
  checkpoint: SyncCheckpoint
): void {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    syncStatePath(directory),
    `${JSON.stringify(checkpoint, null, 2)}\n`,
    'utf8'
  );
}
