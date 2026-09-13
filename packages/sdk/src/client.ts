import { resolveConfig } from './config';
import { FlagCache } from './flag-cache';
import { SourceKeyRegistry } from './source-key-registry';
import {
  TranslationCache,
  type TranslationChangeListener,
} from './translation-cache';
import { HttpSourceKeyTransport, type MagicLocaleTransport } from './transport';
import type {
  FlagEvaluationContext,
  FlagValue,
  MagicLocaleConfig,
} from './types';

export class MagicLocaleClient {
  private readonly registry: SourceKeyRegistry;
  private readonly cache: TranslationCache;
  private readonly flags: FlagCache;
  private readonly transport: MagicLocaleTransport;
  private readonly refreshIntervalMs: number;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private readonly onPageHide = () => {
    void this.registry.flush(true).catch(this.onError);
  };
  private readonly onVisibilityChange = () => {
    if (typeof document === 'undefined') {
      return;
    }
    if (document.hidden) {
      this.stopPolling();
      return;
    }
    this.startPolling();
  };
  private readonly onError: (error: Error) => void;

  constructor(config: MagicLocaleConfig, transport?: MagicLocaleTransport) {
    const resolved = resolveConfig(config);
    this.onError = resolved.onError;
    this.refreshIntervalMs = resolved.refreshIntervalMs;
    this.cache = new TranslationCache(resolved.locale, resolved.initialBundle);
    this.flags = new FlagCache(resolved.context, resolved.initialFlags);
    this.transport = transport ?? new HttpSourceKeyTransport(resolved);
    this.registry = new SourceKeyRegistry(this.transport, resolved);

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', this.onPageHide);
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.startPolling();
      if (!resolved.initialBundle) {
        void this.refreshTranslations().catch(this.onError);
      }
      if (!resolved.initialFlags) {
        void this.refreshFlags().catch(this.onError);
      }
    }
  }

  translate(key: string, defaultText: string): string {
    this.registry.enqueue(key, defaultText);
    return this.cache.get(key.trim(), defaultText);
  }

  isEnabled(key: string, fallback = false): boolean {
    return this.flags.isEnabled(key, fallback);
  }

  getValue(key: string, fallback: FlagValue = null): FlagValue {
    return this.flags.getValue(key, fallback);
  }

  identify(context: FlagEvaluationContext): void {
    this.flags.identify(context);
  }

  getLocale(): string {
    return this.cache.getLocale();
  }

  async setLocale(locale: string): Promise<void> {
    const normalized = locale.trim();
    if (!normalized) {
      throw new Error('MagicLocale locale must not be empty.');
    }
    await this.refreshTranslations(normalized);
    this.cache.setLocale(normalized);
  }

  async refreshTranslations(locale = this.cache.getLocale()): Promise<void> {
    this.cache.update(await this.transport.pull(locale));
  }

  async refreshFlags(): Promise<void> {
    if (!this.transport.pullFlags) {
      return;
    }
    this.flags.update(await this.transport.pullFlags());
  }

  subscribe(listener: TranslationChangeListener): () => void {
    const unsubscribeTranslations = this.cache.subscribe(listener);
    const unsubscribeFlags = this.flags.subscribe(listener);
    return () => {
      unsubscribeTranslations();
      unsubscribeFlags();
    };
  }

  flush(): Promise<void> {
    return this.registry.flush();
  }

  dispose(): void {
    this.registry.dispose();
    this.stopPolling();
    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', this.onPageHide);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  private startPolling(): void {
    if (this.refreshIntervalMs === 0 || this.refreshTimer) {
      return;
    }
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }
    this.refreshTimer = setInterval(() => {
      void this.refreshTranslations().catch(this.onError);
      void this.refreshFlags().catch(this.onError);
    }, this.refreshIntervalMs);
  }

  private stopPolling(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
