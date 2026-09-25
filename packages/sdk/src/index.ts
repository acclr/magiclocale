import { KeykitClient } from './client';
import type { KeykitConfig } from './types';

let defaultClient: KeykitClient | null = null;

export function configureKeykit(
  config: KeykitConfig
): KeykitClient {
  defaultClient?.dispose();
  defaultClient = new KeykitClient(config);
  return defaultClient;
}

export default function translate(key: string, defaultText: string): string {
  if (!defaultClient) {
    throw new Error(
      'Keykit is not configured. Call configureKeykit() before translate().'
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

export function isEnabled(key: string, fallback = false): boolean {
  return requireClient().isEnabled(key, fallback);
}

export function getValue(
  key: string,
  fallback?: import('./types').FlagValue
) {
  return requireClient().getValue(key, fallback);
}

export function identify(
  context: import('./types').FlagEvaluationContext
): void {
  requireClient().identify(context);
}

export function subscribe(listener: () => void): () => void {
  return requireClient().subscribe(listener);
}

function requireClient(): KeykitClient {
  if (!defaultClient) {
    throw new Error(
      'Keykit is not configured. Call configureKeykit() first.'
    );
  }
  return defaultClient;
}

export { KeykitClient } from './client';
export { catalogsFromFile } from './config';
export { evaluateFlag, isEnabledValue } from './evaluate';
export { loadTranslationBundle } from './load-bundle';
export type {
  FetchLike,
  FlagEvaluationContext,
  FlagPayload,
  FlagSnapshot,
  FlagValue,
  KeykitCatalogFile,
  KeykitConfig,
  KeykitDelivery,
  LocaleCatalog,
  LocaleCatalogs,
  SourceKey,
  TranslationBundle,
} from './types';
