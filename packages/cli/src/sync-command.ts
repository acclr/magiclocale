import { pushSourceKeys } from './push-keys';
import { scanProject, type ScanOptions } from './scan';
import { createSyncSession } from './sync-control';
import {
  DEFAULT_CHUNK_DELAY_MS,
  DEFAULT_CHUNK_SIZE,
  pendingKeys,
  removedKeys,
  runChunkedSync,
  withoutKeys,
} from './sync-batch';
import { readSyncCheckpoint, writeSyncCheckpoint } from './sync-state';
import { createSyncDisplay, type SyncFrame } from './sync-ui';

export type SyncCommandOptions = {
  root: string;
  directory: string;
  baseUrl: string;
  projectId: string;
  token: string;
  environment?: string;
  scan: ScanOptions;
  chunkSize: number;
  delayMs: number;
  fetch?: typeof fetch;
  /** Allow p/c/q keyboard control. Defaults to whether stdout is a terminal. */
  interactive?: boolean;
  /** Mark keys that a full scan no longer finds as deprecated. Defaults to true. */
  deprecateRemoved?: boolean;
  /** Print nothing when there is nothing to upload. */
  quietWhenUnchanged?: boolean;
};

export async function executeSync(options: SyncCommandOptions): Promise<void> {
  const scan = scanProject(options.root, options.scan);
  const scope =
    options.scan.include && options.scan.include.length > 0
      ? options.scan.include.join(', ')
      : 'entire project';
  const checkpoint = readSyncCheckpoint(options.directory, options.projectId);
  const queued = pendingKeys(scan.keys, checkpoint.synced);
  const removed =
    options.deprecateRemoved === false
      ? []
      : keysMissingFromScan(scan, options.scan, checkpoint.synced);

  if (queued.length === 0 && removed.length === 0) {
    if (options.quietWhenUnchanged) {
      return;
    }
    console.log(
      scan.keys.length === 0
        ? `No translation keys found in ${scope} (${scan.fileCount} files).`
        : `Scanned ${scan.keys.length} keys in ${scan.fileCount} files. Nothing new to sync.`
    );
    return;
  }

  if (queued.length === 0) {
    const deprecated = await reportRemovedKeys(options, removed);
    writeSyncCheckpoint(options.directory, {
      version: 1,
      projectId: options.projectId,
      synced: withoutKeys(checkpoint.synced, removed),
    });
    console.log(
      `Scanned ${scan.keys.length} keys in ${scan.fileCount} files. Nothing new to sync. ${deprecatedSummary(deprecated)}`
    );
    return;
  }

  const unchanged = scan.keys.length - queued.length;
  const interactive =
    queued.length > options.chunkSize &&
    (options.interactive ?? Boolean(process.stdout.isTTY));
  const display = interactive ? createSyncDisplay() : null;
  const session = interactive
    ? createSyncSession(process.stdin, (event) => {
        if (event === 'pause') {
          display?.replaceStatus('paused', 'Paused. c continues, q saves and quits.');
        } else if (event === 'resume') {
          display?.replaceStatus('syncing');
        }
      })
    : null;

  const frame = (): SyncFrame => ({
    projectId: options.projectId,
    scope,
    sent: 0,
    total: queued.length,
    chunkIndex: 0,
    chunkCount: Math.ceil(queued.length / options.chunkSize),
    chunkSize: options.chunkSize,
    status: 'syncing',
    preview: [],
  });

  if (!interactive) {
    const skipped = unchanged > 0 ? ` ${unchanged} unchanged.` : '';
    console.log(
      `Syncing ${queued.length} keys from ${scope} (${scan.fileCount} files) in batches of ${options.chunkSize}.${skipped}`
    );
  } else {
    display?.show({
      ...frame(),
      message: unchanged > 0 ? `${unchanged} unchanged keys skipped.` : undefined,
    });
  }

  try {
    const result = await runChunkedSync({
      keys: queued,
      root: options.root,
      chunkSize: options.chunkSize,
      delayMs: options.delayMs,
      synced: checkpoint.synced,
      control: session ?? undefined,
      push: (batch) =>
        pushSourceKeys({
          baseUrl: options.baseUrl,
          projectId: options.projectId,
          token: options.token,
          environment: options.environment,
          keys: batch,
          fetch: options.fetch,
        }),
      onProgress: (progress) => {
        if (progress.phase === 'complete') {
          writeSyncCheckpoint(options.directory, {
            version: 1,
            projectId: options.projectId,
            synced: progress.synced,
          });
        }
        if (!display) {
          if (progress.phase === 'complete') {
            console.log(
              `chunk ${progress.chunkIndex}/${progress.chunkCount}  ${progress.sent}/${progress.total}`
            );
          }
          return;
        }
        const status = session?.isPaused() ? 'paused' : progress.status;
        display.show({
          ...frame(),
          sent: progress.sent,
          chunkIndex: progress.chunkIndex,
          status,
          preview: progress.preview,
        });
      },
    });

    writeSyncCheckpoint(options.directory, {
      version: 1,
      projectId: options.projectId,
      synced: result.synced,
    });

    if (result.stopped === 'done' && removed.length > 0) {
      const deprecated = await reportRemovedKeys(options, removed);
      writeSyncCheckpoint(options.directory, {
        version: 1,
        projectId: options.projectId,
        synced: withoutKeys(result.synced, removed),
      });
      const summary = `Synced ${result.sent} keys. ${deprecatedSummary(deprecated)}`;
      if (display) {
        display.finish(summary);
      } else {
        console.log(summary);
      }
      return;
    }

    if (result.stopped === 'error') {
      const message = result.error?.message ?? 'Keykit sync failed.';
      const summary = `Synced ${result.sent} of ${queued.length} keys. ${message} Run keykit sync again to continue.`;
      if (display) {
        display.finish(summary);
      }
      throw new Error(summary);
    }

    if (result.stopped === 'aborted') {
      const summary = `Saved progress at ${result.sent} of ${queued.length} keys. Run keykit sync again to continue.`;
      if (display) {
        display.finish(summary);
      } else {
        console.log(summary);
      }
      return;
    }

    const summary = `Synced ${result.sent} keys.`;
    if (display) {
      display.finish(summary);
    } else {
      console.log(summary);
    }
  } finally {
    session?.detach();
  }
}

export function resolveScanOptions(
  config: object,
  include: readonly string[],
  exclude: readonly string[]
): ScanOptions {
  const scan = readScanConfig(config);
  return {
    include: include.length > 0 ? include : scan?.include,
    exclude: exclude.length > 0 ? exclude : scan?.exclude,
  };
}

function readScanConfig(
  config: object
): { include?: readonly string[]; exclude?: readonly string[] } | undefined {
  if (!('scan' in config) || !config.scan || typeof config.scan !== 'object') {
    return undefined;
  }
  return config.scan as {
    include?: readonly string[];
    exclude?: readonly string[];
  };
}

function keysMissingFromScan(
  scan: { keys: Parameters<typeof removedKeys>[0]; fileCount: number },
  scanOptions: ScanOptions,
  synced: Record<string, string>
): string[] {
  const include = scanOptions.include ?? [];
  const exclude = scanOptions.exclude ?? [];
  if (include.length > 0 || exclude.length > 0 || scan.fileCount === 0) {
    return [];
  }
  return removedKeys(scan.keys, synced);
}

async function reportRemovedKeys(
  options: SyncCommandOptions,
  removed: readonly string[]
): Promise<string[]> {
  const deprecated: string[] = [];
  for (let index = 0; index < removed.length; index += options.chunkSize) {
    const batch = removed.slice(index, index + options.chunkSize);
    await pushSourceKeys({
      baseUrl: options.baseUrl,
      projectId: options.projectId,
      token: options.token,
      environment: options.environment,
      keys: [],
      removed: batch,
      fetch: options.fetch,
    });
    deprecated.push(...batch);
  }
  return deprecated;
}

function deprecatedSummary(keys: readonly string[]): string {
  const preview = keys.slice(0, 8).join(', ');
  const extra = keys.length > 8 ? `, and ${keys.length - 8} more` : '';
  return `Marked ${keys.length} removed ${keys.length === 1 ? 'key' : 'keys'} as deprecated: ${preview}${extra}.`;
}

export { DEFAULT_CHUNK_DELAY_MS, DEFAULT_CHUNK_SIZE };
