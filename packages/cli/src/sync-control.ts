import type { ChunkSyncControl } from './sync-batch';

type Decision = 'continue' | 'abort';

export type SyncSession = ChunkSyncControl & {
  pause(): void;
  resume(): void;
  abort(): void;
  isPaused(): boolean;
  detach(): void;
};

export function createSyncSession(
  input: NodeJS.ReadStream = process.stdin,
  onChange?: (event: 'pause' | 'resume' | 'abort') => void
): SyncSession {
  let paused = false;
  let aborted = false;
  const waiters: Array<(decision: Decision) => void> = [];

  const release = (decision: Decision) => {
    const pending = waiters.splice(0);
    for (const waiter of pending) {
      waiter(decision);
    }
  };

  const onData = (key: string) => {
    if (key === '\u0003' || key === 'q' || key === 'Q') {
      aborted = true;
      onChange?.('abort');
      release('abort');
      return;
    }
    if (key === 'p' || key === 'P' || key === ' ') {
      paused = true;
      onChange?.('pause');
      return;
    }
    if (key === 'c' || key === 'C') {
      paused = false;
      onChange?.('resume');
      release('continue');
    }
  };

  const interactive = Boolean(input.isTTY && input.setRawMode);
  if (interactive) {
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    input.on('data', onData);
  }

  return {
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
      release('continue');
    },
    abort() {
      aborted = true;
      release('abort');
    },
    isPaused() {
      return paused;
    },
    isAborted() {
      return aborted;
    },
    async waitIfPaused() {
      if (aborted) {
        return 'abort';
      }
      if (!paused) {
        return 'continue';
      }
      return new Promise<Decision>((resolve) => {
        waiters.push(resolve);
      });
    },
    detach() {
      if (!interactive) {
        return;
      }
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
    },
  };
}
