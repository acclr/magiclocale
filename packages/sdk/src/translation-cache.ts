import type { LocaleCatalogs, TranslationBundle } from './types';

export type TranslationChangeListener = () => void;

export class TranslationCache {
  private readonly bundles = new Map<string, Record<string, string>>();
  private readonly versions = new Map<string, string>();
  private readonly listeners = new Set<TranslationChangeListener>();
  private locale: string;

  constructor(
    initialLocale: string,
    initialBundle?: TranslationBundle,
    catalogs?: LocaleCatalogs
  ) {
    this.locale = initialLocale;
    if (catalogs) {
      for (const [locale, translations] of Object.entries(catalogs)) {
        this.bundles.set(locale, translations);
        this.versions.set(locale, 'local');
      }
    }
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
    const previous = this.bundles.get(bundle.locale);
    const sameVersion = this.versions.get(bundle.locale) === bundle.version;
    if (
      sameVersion &&
      previous &&
      sameTranslations(previous, bundle.translations)
    ) {
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

function sameTranslations(
  left: Record<string, string>,
  right: Record<string, string>
): boolean {
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) {
    return false;
  }
  return leftKeys.every((key) => left[key] === right[key]);
}
