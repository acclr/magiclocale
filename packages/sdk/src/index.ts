import { LocaleKitClient } from './client';
import type { LocaleKitConfig } from './types';

let defaultClient: LocaleKitClient | null = null;

export function configureLocaleKit(
  config: LocaleKitConfig
): LocaleKitClient {
  defaultClient?.dispose();
  defaultClient = new LocaleKitClient(config);
  return defaultClient;
}

export default function translate(key: string, defaultText: string): string {
  if (!defaultClient) {
    throw new Error(
      'LocaleKit is not configured. Call configureLocaleKit() before translate().'
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

function requireClient(): LocaleKitClient {
  if (!defaultClient) {
    throw new Error(
      'LocaleKit is not configured. Call configureLocaleKit() first.'
    );
  }
  return defaultClient;
}

export { LocaleKitClient } from './client';
export { evaluateFlag, isEnabledValue } from './evaluate';
export { loadTranslationBundle } from './load-bundle';
export type {
  FetchLike,
  FlagEvaluationContext,
  FlagPayload,
  FlagSnapshot,
  FlagValue,
  LocaleKitConfig,
  SourceKey,
  TranslationBundle,
} from './types';
