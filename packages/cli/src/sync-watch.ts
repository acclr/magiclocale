import { watch as fsWatch } from 'node:fs';
import { isScannablePath, type ScanOptions } from './scan';

export const DEFAULT_WATCH_DEBOUNCE_MS = 400;

export type WatchCloser = { close(): void };

/** Calls `onChange` with a path relative to `root`, or null when the platform omits it. */
export type FileWatcher = (
  root: string,
  onChange: (file: string | null) => void
) => WatchCloser;

export type SyncWatcherOptions = {
  root: string;
  scan: ScanOptions;
  /** One sync pass. Errors are reported and the watcher keeps running. */
  run: () => Promise<void>;
  debounceMs?: number;
  watch?: FileWatcher;
  onError?: (error: Error) => void;
  setTimer?: (callback: () => void, milliseconds: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

export type SyncWatcher = {
  /** Resolves when no sync is running or queued. */
  idle(): Promise<void>;
  close(): void;
};

/**
 * Re-runs `run` after source files in scope change. Saves that land while a
 * sync is in flight queue one more pass instead of overlapping requests.
 */
export function startSyncWatcher(options: SyncWatcherOptions): SyncWatcher {
  const debounceMs = options.debounceMs ?? DEFAULT_WATCH_DEBOUNCE_MS;
  const watch = options.watch ?? nodeFileWatcher;
  const setTimer = options.setTimer ?? setTimeout;
  const clearTimer =
    options.clearTimer ??
    ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  const onError =
    options.onError ?? ((error: Error) => console.error(error.message));

  let timer: unknown = null;
  let running: Promise<void> | null = null;
  let queued = false;
  let closed = false;

  const runPass = async (): Promise<void> => {
    do {
      queued = false;
      try {
        await options.run();
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    } while (queued && !closed);
  };

  const trigger = () => {
    timer = null;
    if (closed) {
      return;
    }
    if (running) {
      queued = true;
      return;
    }
    running = runPass().finally(() => {
      running = null;
    });
  };

  const schedule = () => {
    if (timer !== null) {
      clearTimer(timer);
    }
    timer = setTimer(trigger, debounceMs);
  };

  const watcher = watch(options.root, (file) => {
    if (closed) {
      return;
    }
    if (file !== null && !isScannablePath(options.root, file, options.scan)) {
      return;
    }
    schedule();
  });

  return {
    async idle() {
      while (running) {
        await running;
      }
    },
    close() {
      closed = true;
      if (timer !== null) {
        clearTimer(timer);
        timer = null;
      }
      watcher.close();
    },
  };
}

export const nodeFileWatcher: FileWatcher = (root, onChange) => {
  const watcher = fsWatch(root, { recursive: true }, (_event, file) => {
    onChange(file ? file.toString() : null);
  });
  return { close: () => watcher.close() };
};
