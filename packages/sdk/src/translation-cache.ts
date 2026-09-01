import type { TranslationBundle } from './types';

export type TranslationChangeListener = () => void;

export class TranslationCache {
  private readonly bundles = new Map<string, Record<string, string>>();
  private readonly versions = new Map<string, string>();
  private readonly listeners = new Set<TranslationChangeListener>();
  private locale: string;

  constructor(initialLocale: string, initialBundle?: TranslationBundle) {
    this.locale = initialLocale;
    if (initialBundle) {
      this.bundles.set(initialBundle.locale, initialBundle.translations);
      this.versions.set(initialBundle.locale, initialBundle.version);
    }
  }

  getLocale(): string {
    return this.locale;
  }

  setLocale(locale: string): void {
    this.locale = locale;
    this.emit();
  }

  get(key: string, defaultText: string): string {
    return this.bundles.get(this.locale)?.[key] ?? defaultText;
  }

  update(bundle: TranslationBundle): void {
    if (this.versions.get(bundle.locale) === bundle.version) {
      return;
    }
    this.bundles.set(bundle.locale, bundle.translations);
    this.versions.set(bundle.locale, bundle.version);
    if (bundle.locale === this.locale) {
      this.emit();
    }
  }

  subscribe(listener: TranslationChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
