import type { TranslationBundle } from '@localekit/sdk';

export const LOCALEKIT_LOCALE_COOKIE = 'localekit-locale';
export const SELF_HOSTED_REFRESH_INTERVAL_MS = 30_000;

export type SelfHostedSdkConfig = {
  baseUrl: string;
  projectId: string;
  ingestToken: string;
  sourceLocale: string;
  refreshIntervalMs: number;
};

export type SelfHostedLocalePageProps = {
  locale: string;
  locales: string[];
  config: SelfHostedSdkConfig | null;
  initialBundle: TranslationBundle | null;
};

export function parseSelfHostedLocale(
  value: string | undefined,
  locales: readonly string[],
  fallback: string
): string {
  const locale = value?.trim();
  if (locale && locales.includes(locale)) {
    return locale;
  }
  return fallback;
}

export function createSelfHostedSdkConfig(input: {
  appUrl: string;
  projectId?: string;
  ingestToken?: string;
  sourceLocale?: string;
}): SelfHostedSdkConfig | null {
  const projectId = input.projectId?.trim();
  const ingestToken = input.ingestToken?.trim();
  const baseUrl = input.appUrl.trim().replace(/\/+$/, '');
  const sourceLocale = input.sourceLocale?.trim() || 'en';

  if (!projectId || !ingestToken || !baseUrl) {
    return null;
  }

  return {
    baseUrl,
    projectId,
    ingestToken,
    sourceLocale,
    refreshIntervalMs: SELF_HOSTED_REFRESH_INTERVAL_MS,
  };
}

export const emptySelfHostedLocalePageProps: SelfHostedLocalePageProps = {
  locale: 'en',
  locales: ['en'],
  config: null,
  initialBundle: null,
};
