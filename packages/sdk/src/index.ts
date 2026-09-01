import { MagicLocaleClient } from './client';
import type { MagicLocaleConfig } from './types';

let defaultClient: MagicLocaleClient | null = null;

export function configureMagicLocale(
  config: MagicLocaleConfig
): MagicLocaleClient {
  defaultClient?.dispose();
  defaultClient = new MagicLocaleClient(config);
  return defaultClient;
}

export default function translate(key: string, defaultText: string): string {
  if (!defaultClient) {
    throw new Error(
      'MagicLocale is not configured. Call configureMagicLocale() before translate().'
    );
  }
  return defaultClient.translate(key, defaultText);
}

export function flush(): Promise<void> {
  return defaultClient?.flush() ?? Promise.resolve();
}

export function getLocale(): string {
  return requireClient().getLocale();
}

export function setLocale(locale: string): Promise<void> {
  return requireClient().setLocale(locale);
}

export function refreshTranslations(): Promise<void> {
  return requireClient().refreshTranslations();
}

export function subscribe(listener: () => void): () => void {
  return requireClient().subscribe(listener);
}

function requireClient(): MagicLocaleClient {
  if (!defaultClient) {
    throw new Error(
      'MagicLocale is not configured. Call configureMagicLocale() first.'
    );
  }
  return defaultClient;
}

export { MagicLocaleClient } from './client';
export { loadTranslationBundle } from './load-bundle';
export type {
  FetchLike,
  MagicLocaleConfig,
  SourceKey,
  TranslationBundle,
} from './types';
