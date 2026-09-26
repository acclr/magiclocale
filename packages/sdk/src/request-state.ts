import { cookies, headers } from 'next/headers';
import { after } from 'next/server';
import { cache } from 'react';
import { KeykitClient } from './client';
import { createKeykit } from './create-keykit';
import type { KeykitProjectConfig } from './define-config';
import { loadTranslationBundle } from './load-bundle';
import { resolveKeykitSetup, toCreateKeykitOptions } from './project-config.js';
import { resolveRequestLocale } from './request-locale';
import type { KeykitConfig, TranslationBundle } from './types';

export type KeykitNextConfig = KeykitConfig & {
  cookieName?: string;
  defaultLocale?: string;
  locales?: readonly string[];
};

export type KeykitRequestState = {
  locale: string;
  client: KeykitClient;
  initialBundle?: TranslationBundle;
  browserConfig: KeykitConfig;
  cookieName: string;
  sourceCatalog?: Record<string, string>;
};

const LOCALE_HEADER = 'x-keykit-locale';

let configured: KeykitNextConfig | undefined;

/** Call once at module scope. Later requests share this config. */
export function configureKeykitNext(config: KeykitNextConfig): void {
  configured = config;
}

export function resetKeykitNextConfigForTests(): void {
  configured = undefined;
}

export const getKeykitRequestState = cache(
  async (): Promise<KeykitRequestState> => {
    const config = await resolveActiveConfig();
    const cookieName = config.cookieName ?? 'keykit-locale';
    const sourceLocale = config.sourceLocale ?? 'en';
    const defaultLocale = config.defaultLocale ?? config.locale ?? sourceLocale;
    const headerStore = await headers();
    const cookieStore = await cookies();
    const locale = resolveRequestLocale({
      cookieLocale: cookieStore.get(cookieName)?.value,
      headerLocale: headerStore.get(LOCALE_HEADER),
      acceptLanguage: headerStore.get('accept-language'),
      defaultLocale,
      locales: config.locales,
    });

    let initialBundle: TranslationBundle | undefined =
      bundleFromCatalogs(config, locale) ?? undefined;
    if (config.delivery !== 'static') {
      try {
        initialBundle = await loadTranslationBundle(
          { ...config, refreshIntervalMs: 0 },
          locale
        );
      } catch (error) {
        reportError(config, error);
      }
    }

    const client = new KeykitClient({
      ...config,
      locale,
      initialBundle,
      refreshIntervalMs: 0,
    });
    const state: KeykitRequestState = {
      locale,
      client,
      initialBundle,
      browserConfig: toBrowserConfig(config),
      cookieName,
      sourceCatalog: config.sourceCatalog,
    };

    after(async () => {
      try {
        await state.client.flush();
      } finally {
        state.client.dispose();
      }
    });

    return state;
  }
);

async function resolveActiveConfig(): Promise<KeykitNextConfig> {
  const setup = await resolveKeykitSetup(programmaticConfig(configured));
  const created = createKeykit(toCreateKeykitOptions(setup.config));
  return {
    ...created.config,
    ...(setup.config.cookieName !== undefined
      ? { cookieName: setup.config.cookieName }
      : {}),
    ...(setup.config.defaultLocale !== undefined
      ? { defaultLocale: setup.config.defaultLocale }
      : {}),
    ...(setup.config.locales !== undefined
      ? { locales: setup.config.locales }
      : {}),
  };
}

function programmaticConfig(
  config: KeykitNextConfig | undefined
): KeykitProjectConfig {
  if (!config) {
    return {};
  }
  return {
    ...(config.ingestToken !== undefined ? { apiKey: config.ingestToken } : {}),
    ...(config.projectId !== undefined ? { projectId: config.projectId } : {}),
    ...(config.baseUrl !== undefined ? { baseUrl: config.baseUrl } : {}),
    ...(config.sourceLocale !== undefined
      ? { sourceLocale: config.sourceLocale }
      : {}),
    ...(config.locale !== undefined ? { locale: config.locale } : {}),
    ...(config.delivery !== undefined ? { delivery: config.delivery } : {}),
    ...(config.catalogs !== undefined ? { catalogs: config.catalogs } : {}),
    ...(config.sourceCatalog !== undefined
      ? { sourceCatalog: config.sourceCatalog }
      : {}),
    ...(config.refreshIntervalMs !== undefined
      ? { refreshIntervalMs: config.refreshIntervalMs }
      : {}),
    ...(config.environment !== undefined
      ? { environment: config.environment }
      : {}),
    ...(config.version !== undefined ? { version: config.version } : {}),
    ...(config.cookieName !== undefined
      ? { cookieName: config.cookieName }
      : {}),
    ...(config.defaultLocale !== undefined
      ? { defaultLocale: config.defaultLocale }
      : {}),
    ...(config.locales !== undefined ? { locales: config.locales } : {}),
  };
}

function bundleFromCatalogs(
  config: KeykitConfig,
  locale: string
): TranslationBundle | undefined {
  const translations = config.catalogs?.[locale];
  if (!translations) {
    return undefined;
  }
  return {
    projectId: config.projectId ?? '',
    locale,
    sourceLocale: config.sourceLocale ?? 'en',
    translations,
    version: 'local',
    environment: config.environment,
  };
}

function toBrowserConfig(config: KeykitNextConfig): KeykitConfig {
  return {
    delivery: config.delivery,
    baseUrl: config.baseUrl,
    projectId: config.projectId,
    ingestToken: config.ingestToken,
    sourceLocale: config.sourceLocale,
    locale: config.locale,
    catalogs: config.catalogs,
    sourceCatalog: config.sourceCatalog,
    refreshIntervalMs:
      config.delivery === 'static' ? 0 : config.refreshIntervalMs,
    debounceMs: config.debounceMs,
    batchSize: config.batchSize,
    maxRetries: config.maxRetries,
    retryDelayMs: config.retryDelayMs,
    environment: config.environment,
    version: config.version,
    context: config.context,
  };
}

function reportError(config: KeykitConfig, error: unknown): void {
  const normalized = error instanceof Error ? error : new Error(String(error));
  if (config.onError) {
    config.onError(normalized);
    return;
  }
  console.warn('[Keykit]', normalized.message);
}
