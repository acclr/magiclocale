import { join } from 'node:path';
import { isScannablePath } from '../../packages/cli/src/scan';
import { startSyncWatcher, type FileWatcher } from '../../packages/cli/src/sync-watch';

const root = join('C:\\work', 'demo');

function fakeWatcher() {
  let emit: (file: string | null) => void = () => undefined;
  let closed = false;
  const watch: FileWatcher = (_root, onChange) => {
    emit = onChange;
    return {
      close: () => {
        closed = true;
      },
    };
  };
  return {
    watch,
    emit: (file: string | null) => emit(file),
    isClosed: () => closed,
  };
}

function manualTimers() {
  const pending = new Map<number, () => void>();
  let next = 0;
  return {
    setTimer: (callback: () => void) => {
      next += 1;
      pending.set(next, callback);
      return next;
    },
    clearTimer: (handle: unknown) => {
      pending.delete(handle as number);
    },
    flush: () => {
      const callbacks = Array.from(pending.values());
      pending.clear();
      callbacks.forEach((callback) => callback());
    },
    size: () => pending.size,
  };
}

describe('isScannablePath', () => {
  it('accepts source files and skips build output and other extensions', () => {
    expect(isScannablePath(root, join('components', 'RandomComponent.tsx'))).toBe(true);
    expect(isScannablePath(root, join('.next', 'server', 'page.js'))).toBe(false);
    expect(isScannablePath(root, join('node_modules', 'x', 'index.js'))).toBe(false);
    expect(isScannablePath(root, join('.keykit', 'sync-state.json'))).toBe(false);
    expect(isScannablePath(root, 'README.md')).toBe(false);
  });

  it('respects include and exclude scope', () => {
    const scan = { include: ['app'], exclude: ['app/legacy'] };
    expect(isScannablePath(root, join('app', 'page.tsx'), scan)).toBe(true);
    expect(isScannablePath(root, join('app', 'legacy', 'old.tsx'), scan)).toBe(false);
    expect(isScannablePath(root, join('components', 'a.tsx'), scan)).toBe(false);
  });
});

describe('startSyncWatcher', () => {
  it('debounces a burst of saves into one sync and ignores unrelated files', async () => {
    const files = fakeWatcher();
    const timers = manualTimers();
    let runs = 0;
    const watcher = startSyncWatcher({
      root,
      scan: {},
      run: async () => {
        runs += 1;
      },
      watch: files.watch,
      setTimer: timers.setTimer,
      clearTimer: timers.clearTimer,
    });

    files.emit(join('.next', 'cache', 'x.js'));
    expect(timers.size()).toBe(0);

    files.emit(join('components', 'RandomComponent.tsx'));
    files.emit(join('components', 'RandomComponent.tsx'));
    files.emit(null);
    expect(timers.size()).toBe(1);

    timers.flush();
    await watcher.idle();
    expect(runs).toBe(1);

    watcher.close();
    expect(files.isClosed()).toBe(true);
  });

  it('queues one more pass for saves during a running sync', async () => {
    const files = fakeWatcher();
    const timers = manualTimers();
    let release: () => void = () => undefined;
    let runs = 0;
    const watcher = startSyncWatcher({
      root,
      scan: {},
      run: () => {
        runs += 1;
        return runs === 1
          ? new Promise<void>((resolve) => {
              release = resolve;
            })
          : Promise.resolve();
      },
      watch: files.watch,
      setTimer: timers.setTimer,
      clearTimer: timers.clearTimer,
    });

    files.emit('a.tsx');
    timers.flush();
    files.emit('b.tsx');
    timers.flush();
    files.emit('c.tsx');
    timers.flush();
    expect(runs).toBe(1);

    release();
    await watcher.idle();
    expect(runs).toBe(2);
    watcher.close();
  });

  it('reports a failed sync and keeps watching', async () => {
    const files = fakeWatcher();
    const timers = manualTimers();
    const errors: string[] = [];
    let runs = 0;
    const watcher = startSyncWatcher({
      root,
      scan: {},
      run: async () => {
        runs += 1;
        if (runs === 1) {
          throw new Error('offline');
        }
      },
      onError: (error) => errors.push(error.message),
      watch: files.watch,
      setTimer: timers.setTimer,
      clearTimer: timers.clearTimer,
    });

    files.emit('a.tsx');
    timers.flush();
    await watcher.idle();
    files.emit('a.tsx');
    timers.flush();
    await watcher.idle();

    expect(errors).toEqual(['offline']);
    expect(runs).toBe(2);
    watcher.close();
  });
});
