import { cookies } from 'next/headers';
import { after } from 'next/server';
import { cache, type ReactNode } from 'react';
import { LocaleKitClient } from './client';
import { loadTranslationBundle } from './load-bundle';
import { LocaleKitNextClientProvider } from './next-client.js';
import type { LocaleKitConfig, TranslationBundle } from './types';

export type LocaleKitNextConfig = LocaleKitConfig & {
  cookieName?: string;
  defaultLocale?: string;
  locales?: readonly string[];
};

export type LocaleKitServerTranslator = {
  locale: string;
  translate: (key: string, defaultText: string) => string;
};

export function createLocaleKitNext(config: LocaleKitNextConfig) {
  const cookieName = config.cookieName ?? 'localekit-locale';
  const sourceLocale = config.sourceLocale ?? 'en';
  const defaultLocale = config.defaultLocale ?? config.locale ?? sourceLocale;
  const allowedLocales = new Set(
    config.locales ?? [sourceLocale, defaultLocale]
  );
  const browserConfig = toBrowserConfig(config);

  const getRequestState = cache(async () => {
    const cookieStore = await cookies();
    const requestedLocale = cookieStore.get(cookieName)?.value;
    const locale =
      requestedLocale && allowedLocales.has(requestedLocale)
        ? requestedLocale
        : defaultLocale;
    let initialBundle: TranslationBundle | undefined;
    try {
      initialBundle = await loadTranslationBundle(
        { ...config, refreshIntervalMs: 0 },
        locale
      );
    } catch (error) {
      reportError(config, error);
    }

    const client = new LocaleKitClient({
      ...config,
      locale,
      initialBundle,
      refreshIntervalMs: 0,
    });
    return { client, initialBundle, locale, flushScheduled: false };
  });

  async function LocaleKitProvider({
    children,
  }: Readonly<{ children: ReactNode }>) {
    const { initialBundle, locale } = await getRequestState();
    return (
      <LocaleKitNextClientProvider
        config={browserConfig}
        initialLocale={locale}
        initialBundle={initialBundle}
        cookieName={cookieName}
      >
        {children}
      </LocaleKitNextClientProvider>
    );
  }

  async function getLocaleKit(): Promise<LocaleKitServerTranslator> {
    const state = await getRequestState();
    if (!state.flushScheduled) {
      state.flushScheduled = true;
      after(async () => {
        try {
          await state.client.flush();
        } finally {
          state.client.dispose();
        }
      });
    }
    return {
      locale: state.locale,
      translate: state.client.translate.bind(state.client),
    };
  }

  return { LocaleKitProvider, getLocaleKit };
}

function toBrowserConfig(config: LocaleKitNextConfig): LocaleKitConfig {
  return {
    baseUrl: config.baseUrl,
    projectId: config.projectId,
    ingestToken: config.ingestToken,
    sourceLocale: config.sourceLocale,
    locale: config.locale,
    refreshIntervalMs: config.refreshIntervalMs,
    debounceMs: config.debounceMs,
    batchSize: config.batchSize,
    maxRetries: config.maxRetries,
    retryDelayMs: config.retryDelayMs,
    environment: config.environment,
    version: config.version,
    context: config.context,
  };
}

function reportError(config: LocaleKitConfig, error: unknown): void {
  const normalized = error instanceof Error ? error : new Error(String(error));
  if (config.onError) {
    config.onError(normalized);
    return;
  }
  console.warn('[LocaleKit]', normalized.message);
}
