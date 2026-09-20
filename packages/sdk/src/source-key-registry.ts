import type { ResolvedKeykitConfig, SourceKey } from './types';
import type { SourceKeyTransport } from './transport';

export class SourceKeyRegistry {
  private readonly pending = new Map<string, SourceKey>();
  private readonly acknowledged = new Map<string, string>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private activeFlush: Promise<void> | null = null;

  constructor(
    private readonly transport: SourceKeyTransport,
    private readonly config: Pick<
      ResolvedKeykitConfig,
      'batchSize' | 'debounceMs' | 'maxRetries' | 'retryDelayMs' | 'onError'
    >
  ) {}

  enqueue(key: string, sourceText: string, usage?: SourceKey['usage']): void {
    validateSourceKey(key, sourceText);
    const normalizedKey = key.trim();
    const fingerprint = `${sourceText}:${usageFingerprint(usage)}`;
    if (
      this.pending.get(`translation:${normalizedKey}`)?.sourceText ===
        sourceText ||
      (!this.pending.has(`translation:${normalizedKey}`) &&
        this.acknowledged.get(`translation:${normalizedKey}`) === fingerprint)
    ) {
      return;
    }
    this.pending.set(`translation:${normalizedKey}`, {
      key: normalizedKey,
      sourceText,
      type: 'translation',
      usage,
    });
    this.schedule();
  }

  enqueueFlag(key: string, usage?: SourceKey['usage']): void {
    if (typeof key !== 'string' || key.trim().length === 0) {
      throw new Error('Keykit flag key must not be empty.');
    }
    const normalizedKey = key.trim();
    const fingerprint = usageFingerprint(usage);
    const mapKey = `feature-flag:${normalizedKey}`;
    if (
      !this.pending.has(mapKey) &&
      this.acknowledged.get(mapKey) === fingerprint
    ) {
      return;
    }
    this.pending.set(mapKey, {
      key: normalizedKey,
      type: 'feature-flag',
      usage,
    });
    this.schedule();
  }

  async flush(keepalive = false): Promise<void> {
    this.clearTimer();
    if (this.activeFlush) {
      await this.activeFlush;
    }
    if (this.pending.size === 0) {
      return;
    }

    const flush = this.drain(keepalive);
    this.activeFlush = flush;
    try {
      await flush;
    } finally {
      if (this.activeFlush === flush) {
        this.activeFlush = null;
      }
    }
    if (this.pending.size > 0 && !keepalive) {
      await this.flush();
    }
  }

  dispose(): void {
    this.clearTimer();
  }

  private async drain(keepalive: boolean): Promise<void> {
    while (this.pending.size > 0) {
      const batch = [...this.pending.values()].slice(0, this.config.batchSize);
      for (const item of batch) {
        const mapKey = `${item.type ?? 'translation'}:${item.key}`;
        if (this.pending.get(mapKey)?.key === item.key) {
          this.pending.delete(mapKey);
        }
      }

      try {
        await this.pushWithRetry(batch, keepalive);
        for (const item of batch) {
          const mapKey = `${item.type ?? 'translation'}:${item.key}`;
          this.acknowledged.set(
            mapKey,
            `${item.sourceText ?? ''}:${usageFingerprint(item.usage)}`
          );
        }
      } catch (error) {
        for (const item of batch) {
          const mapKey = `${item.type ?? 'translation'}:${item.key}`;
          if (!this.pending.has(mapKey)) {
            this.pending.set(mapKey, item);
          }
        }
        throw asError(error);
      }
    }
  }

  private async pushWithRetry(
    batch: SourceKey[],
    keepalive: boolean
  ): Promise<void> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      try {
        await this.transport.push(batch, keepalive);
        return;
      } catch (error) {
        lastError = asError(error);
        if (attempt < this.config.maxRetries) {
          await wait(this.config.retryDelayMs * 2 ** attempt);
        }
      }
    }
    throw lastError ?? new Error('Keykit ingest failed.');
  }

  private schedule(): void {
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.timer = null;
        void this.flush().catch(this.config.onError);
      }, this.config.debounceMs);
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

function usageFingerprint(usage?: SourceKey['usage']): string {
  if (!usage?.file) {
    return '';
  }
  return `${usage.file}:${usage.line ?? ''}:${usage.column ?? ''}`;
}

function validateSourceKey(key: string, sourceText: string): void {
  if (typeof key !== 'string' || key.trim().length === 0) {
    throw new Error('Keykit translation key must not be empty.');
  }
  if (typeof sourceText !== 'string' || sourceText.trim().length === 0) {
    throw new Error('Keykit default text must not be empty.');
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
