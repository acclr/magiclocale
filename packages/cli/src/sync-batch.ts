import { relative, sep } from 'node:path';
import type { ScannedSourceKey } from './scan';

/** Stay under the API limit of 100 keys per request. */
export const DEFAULT_CHUNK_SIZE = 25;
export const MAX_CHUNK_SIZE = 100;
export const DEFAULT_CHUNK_DELAY_MS = 200;

export type SyncCheckpoint = {
  version: 1;
  projectId: string;
  /** Key name to the source text that was last uploaded. */
  synced: Record<string, string>;
};

export type IngestKey = {
  key: string;
  sourceText: string;
  type: 'translation';
  usage: {
    file: string;
    line: number;
  };
};

export type ChunkSyncControl = {
  waitIfPaused(): Promise<'continue' | 'abort'>;
  isAborted(): boolean;
};

export type ChunkSyncProgress = {
  sent: number;
  total: number;
  chunkIndex: number;
  chunkCount: number;
  phase: 'start' | 'complete';
  status: 'syncing' | 'done';
  preview: string[];
  synced: Record<string, string>;
};

export function chunkItems<T>(items: readonly T[], size: number): T[][] {
  const chunkSize = normalizeChunkSize(size);
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export function normalizeChunkSize(size: number): number {
  if (!Number.isInteger(size) || size < 1) {
    throw new Error('--chunk must be a positive integer.');
  }
  if (size > MAX_CHUNK_SIZE) {
    throw new Error(`--chunk may not exceed ${MAX_CHUNK_SIZE}.`);
  }
  return size;
}

/** Keys whose source text is not already recorded in the checkpoint. */
export function pendingKeys(
  keys: readonly ScannedSourceKey[],
  synced: Record<string, string> | undefined
): ScannedSourceKey[] {
  if (!synced) {
    return [...keys];
  }
  return keys.filter((item) => synced[item.key] !== item.sourceText);
}

export function toIngestKey(item: ScannedSourceKey, root: string): IngestKey {
  const file = relative(root, item.file).split(sep).join('/').slice(0, 500);
  return {
    key: item.key,
    sourceText: item.sourceText,
    type: 'translation',
    usage: {
      file: file || item.file,
      line: item.line,
    },
  };
}

export async function runChunkedSync(options: {
  keys: readonly ScannedSourceKey[];
  root: string;
  chunkSize: number;
  delayMs: number;
  synced?: Record<string, string>;
  push: (batch: IngestKey[]) => Promise<void>;
  control?: ChunkSyncControl;
  onProgress?: (progress: ChunkSyncProgress) => void;
  sleep?: (milliseconds: number) => Promise<void>;
}): Promise<{
  sent: number;
  stopped: 'done' | 'aborted' | 'error';
  error?: Error;
  synced: Record<string, string>;
}> {
  const chunks = chunkItems(options.keys, options.chunkSize);
  const synced = { ...(options.synced ?? {}) };
  const sleep = options.sleep ?? delay;
  let sent = 0;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (options.control) {
      const decision = await options.control.waitIfPaused();
      if (decision === 'abort' || options.control.isAborted()) {
        return { sent, stopped: 'aborted', synced };
      }
    }

    options.onProgress?.({
      sent,
      total: options.keys.length,
      chunkIndex: index + 1,
      chunkCount: chunks.length,
      phase: 'start',
      status: 'syncing',
      preview: chunk.map((item) => item.key),
      synced,
    });

    try {
      await options.push(chunk.map((item) => toIngestKey(item, options.root)));
    } catch (error) {
      return {
        sent,
        stopped: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
        synced,
      };
    }

    for (const item of chunk) {
      synced[item.key] = item.sourceText;
    }
    sent += chunk.length;

    options.onProgress?.({
      sent,
      total: options.keys.length,
      chunkIndex: index + 1,
      chunkCount: chunks.length,
      phase: 'complete',
      status: index === chunks.length - 1 ? 'done' : 'syncing',
      preview: chunk.map((item) => item.key),
      synced,
    });

    if (index < chunks.length - 1 && options.delayMs > 0) {
      await sleep(options.delayMs);
    }
  }

  return { sent, stopped: 'done', synced };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
