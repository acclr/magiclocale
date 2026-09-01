export type SourceKey = {
  key: string;
  sourceText: string;
};

export type TranslationBundle = {
  projectId: string;
  locale: string;
  sourceLocale: string;
  translations: Record<string, string>;
  version: string;
};

export type FetchLike = (
  input: string | URL,
  init?: RequestInit
) => Promise<Response>;

export type MagicLocaleConfig = {
  baseUrl: string;
  projectId: string;
  ingestToken: string;
  sourceLocale?: string;
  locale?: string;
  initialBundle?: TranslationBundle;
  refreshIntervalMs?: number;
  debounceMs?: number;
  batchSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  fetch?: FetchLike;
  onError?: (error: Error) => void;
};

export type ResolvedMagicLocaleConfig = Required<
  Omit<MagicLocaleConfig, 'fetch' | 'onError' | 'initialBundle'>
> & {
  fetch: FetchLike;
  onError: (error: Error) => void;
  initialBundle?: TranslationBundle;
};
