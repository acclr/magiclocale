import {
  fetchKeyMerges,
  pushSourceKeys,
  type KeyMergeMapping,
} from './push-keys';
import { rewriteSourceTreeDetailed, type RewriteResult } from './rewrite';
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

export type MergeKeysCommandOptions = {
  root: string;
  directory: string;
  baseUrl: string;
  projectId: string;
  token: string;
  environment?: string;
  fetch?: typeof fetch;
};

export async function executeMergeKeys(
  options: MergeKeysCommandOptions
): Promise<RewriteResult> {
  const merges = await fetchKeyMerges({
    baseUrl: options.baseUrl,
    projectId: options.projectId,
    token: options.token,
    environment: options.environment,
    fetch: options.fetch,
  });

  if (merges.length === 0) {
    console.log(`No merged keys found for project ${options.projectId}.`);
    return {
      filesChanged: 0,
      rewrittenFiles: [],
      appliedOperations: [],
    };
  }

  const checkpoint = readSyncCheckpoint(options.directory, options.projectId);
  const rewrite = applyKeyMergesToSourceTree(
    options.root,
    options.directory,
    options.projectId,
    checkpoint.synced,
    merges
  );

  if (rewrite.filesChanged === 0) {
    console.log(
      `Checked ${merges.length} merged key mapping(s). Source files are already up to date.`
    );
  } else {
    console.log(mergedSummary(rewrite));
  }

  return rewrite;
}

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
    if (scan.keys.length > 0) {
      try {
        const remoteMerges = await fetchKeyMerges({
          baseUrl: options.baseUrl,
          projectId: options.projectId,
          token: options.token,
          environment: options.environment,
          fetch: options.fetch,
        });
        const scannedKeySet = new Set(scan.keys.map((item) => item.key));
        const applicableMerges = remoteMerges.filter((m) =>
          scannedKeySet.has(m.fromKey)
        );
        if (applicableMerges.length > 0) {
          const rewrite = applyKeyMergesToSourceTree(
            options.root,
            options.directory,
            options.projectId,
            checkpoint.synced,
            applicableMerges
          );
          if (rewrite.filesChanged > 0) {
            console.log(mergedSummary(rewrite));
            return;
          }
        }
      } catch {
        // Ignore remote merge lookup failure when nothing local changed.
      }
    }

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
    const { deprecated, merges } = await reportRemovedKeys(options, removed);
    const nextSynced = withoutKeys(checkpoint.synced, removed);
    writeSyncCheckpoint(options.directory, {
      version: 1,
      projectId: options.projectId,
      synced: nextSynced,
    });
    const rewrite = applyKeyMergesIfPresent(
      options.root,
      options.directory,
      options.projectId,
      nextSynced,
      scan.keys.map((item) => item.key),
      merges
    );
    const parts = [
      `Scanned ${scan.keys.length} keys in ${scan.fileCount} files. Nothing new to sync.`,
    ];
    if (deprecated.length > 0) {
      parts.push(deprecatedSummary(deprecated));
    }
    if (rewrite && rewrite.filesChanged > 0) {
      parts.push(mergedSummary(rewrite));
    }
    console.log(parts.join(' '));
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
          display?.replaceStatus(
            'paused',
            'Paused. c continues, q saves and quits.'
          );
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
      message:
        unchanged > 0 ? `${unchanged} unchanged keys skipped.` : undefined,
    });
  }

  const renamedKeys: Array<{ fromKey: string; toKey: string }> = [];
  const deprecatedFromSync: string[] = [];
  let remoteMerges: KeyMergeMapping[] = [];
  const inlineRemoved = removed.slice(0, options.chunkSize);
  const trailingRemoved = removed.slice(options.chunkSize);
  let inlineRemovedSent = false;

  try {
    const result = await runChunkedSync({
      keys: queued,
      root: options.root,
      chunkSize: options.chunkSize,
      delayMs: options.delayMs,
      synced: checkpoint.synced,
      control: session ?? undefined,
      push: async (batch) => {
        const removedBatch =
          !inlineRemovedSent && inlineRemoved.length > 0
            ? inlineRemoved
            : undefined;
        inlineRemovedSent = true;
        const response = await pushSourceKeys({
          baseUrl: options.baseUrl,
          projectId: options.projectId,
          token: options.token,
          environment: options.environment,
          keys: batch,
          removed: removedBatch,
          fetch: options.fetch,
        });
        if (response.renamedKeys?.length) {
          renamedKeys.push(...response.renamedKeys);
        }
        if (response.deprecated?.length) {
          deprecatedFromSync.push(...response.deprecated);
        }
        if (response.merges?.length) {
          remoteMerges = response.merges;
        } else if (response.mergedKeys?.length) {
          remoteMerges = response.mergedKeys;
        }
      },
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

    let finalSynced = result.synced;
    if (result.stopped === 'done' && removed.length > 0) {
      if (trailingRemoved.length > 0) {
        const extra = await reportRemovedKeys(options, trailingRemoved);
        deprecatedFromSync.push(...extra.deprecated);
        if (extra.merges.length > 0) {
          remoteMerges = extra.merges;
        }
      }
      finalSynced = withoutKeys(finalSynced, removed);
    }

    writeSyncCheckpoint(options.directory, {
      version: 1,
      projectId: options.projectId,
      synced: finalSynced,
    });

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

    const rewrite = applyKeyMergesIfPresent(
      options.root,
      options.directory,
      options.projectId,
      finalSynced,
      scan.keys.map((item) => item.key),
      remoteMerges
    );

    const summaryParts = [`Synced ${result.sent} keys.`];
    if (renamedKeys.length > 0) {
      summaryParts.push(renamedSummary(renamedKeys));
    }
    if (deprecatedFromSync.length > 0) {
      summaryParts.push(deprecatedSummary(deprecatedFromSync));
    }
    if (rewrite && rewrite.filesChanged > 0) {
      summaryParts.push(mergedSummary(rewrite));
    }

    const summary = summaryParts.join(' ');
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
): Promise<{ deprecated: string[]; merges: KeyMergeMapping[] }> {
  const deprecated: string[] = [];
  let merges: KeyMergeMapping[] = [];
  for (let index = 0; index < removed.length; index += options.chunkSize) {
    const batch = removed.slice(index, index + options.chunkSize);
    const response = await pushSourceKeys({
      baseUrl: options.baseUrl,
      projectId: options.projectId,
      token: options.token,
      environment: options.environment,
      keys: [],
      removed: batch,
      fetch: options.fetch,
    });
    if (response.deprecated) {
      deprecated.push(...response.deprecated);
    } else {
      deprecated.push(...batch);
    }
    if (response.merges?.length) {
      merges = response.merges;
    }
  }
  return { deprecated, merges };
}

function applyKeyMergesIfPresent(
  root: string,
  directory: string,
  projectId: string,
  synced: Record<string, string>,
  scannedKeys: readonly string[],
  merges: readonly KeyMergeMapping[]
): RewriteResult | null {
  if (!merges.length) {
    return null;
  }
  const present = new Set(scannedKeys);
  const matching = merges.filter((item) => present.has(item.fromKey));
  if (!matching.length) {
    return null;
  }
  return applyKeyMergesToSourceTree(
    root,
    directory,
    projectId,
    synced,
    matching
  );
}

function applyKeyMergesToSourceTree(
  root: string,
  directory: string,
  projectId: string,
  synced: Record<string, string>,
  merges: readonly KeyMergeMapping[]
): RewriteResult {
  const rewrite = rewriteSourceTreeDetailed(root, {
    operations: merges.map((item) => ({
      type: 'merge-translations',
      fromKey: item.fromKey,
      toKey: item.toKey,
      sourceText: item.sourceText,
    })),
  });

  if (rewrite.appliedOperations.length > 0) {
    const nextSynced = { ...synced };
    const mergeByFrom = new Map(merges.map((item) => [item.fromKey, item]));
    for (const op of rewrite.appliedOperations) {
      const previousSource = nextSynced[op.fromKey];
      const mapping = mergeByFrom.get(op.fromKey);
      const targetSource = mapping?.sourceText ?? previousSource;
      delete nextSynced[op.fromKey];
      if (targetSource !== undefined) {
        nextSynced[op.toKey] = targetSource;
      }
    }
    writeSyncCheckpoint(directory, {
      version: 1,
      projectId,
      synced: nextSynced,
    });
  }

  return rewrite;
}

function renamedSummary(
  renamed: ReadonlyArray<{ fromKey: string; toKey: string }>
): string {
  const preview = renamed
    .slice(0, 6)
    .map((item) => `${item.fromKey} -> ${item.toKey}`)
    .join(', ');
  const extra = renamed.length > 6 ? `, and ${renamed.length - 6} more` : '';
  return `Renamed ${renamed.length} ${renamed.length === 1 ? 'key' : 'keys'}: ${preview}${extra}.`;
}

function mergedSummary(rewrite: RewriteResult): string {
  const count = rewrite.appliedOperations.length;
  const preview = rewrite.appliedOperations
    .slice(0, 6)
    .map((item) => `${item.fromKey} -> ${item.toKey}`)
    .join(', ');
  const extra = count > 6 ? `, and ${count - 6} more` : '';
  return `Merged ${count} ${count === 1 ? 'key' : 'keys'} in ${rewrite.filesChanged} ${rewrite.filesChanged === 1 ? 'file' : 'files'}: ${preview}${extra}.`;
}

function deprecatedSummary(keys: readonly string[]): string {
  const preview = keys.slice(0, 8).join(', ');
  const extra = keys.length > 8 ? `, and ${keys.length - 8} more` : '';
  return `Marked ${keys.length} removed ${keys.length === 1 ? 'key' : 'keys'} as deprecated: ${preview}${extra}.`;
}

export { DEFAULT_CHUNK_DELAY_MS, DEFAULT_CHUNK_SIZE };
