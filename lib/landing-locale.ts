import type { TranslationBundle } from '@magilocale/sdk';

export const LANDING_LOCALE_COOKIE = 'magilocale-locale';
export const LANDING_REFRESH_INTERVAL_MS = 30_000;

export type LandingSdkConfig = {
  baseUrl: string;
  projectId: string;
  ingestToken: string;
  sourceLocale: string;
  refreshIntervalMs: number;
};

export type LandingLocalePageProps = {
  locale: string;
  locales: string[];
  config: LandingSdkConfig | null;
  initialBundle: TranslationBundle | null;
};

export function parseLandingLocale(
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

export function createLandingSdkConfig(input: {
  appUrl: string;
  projectId?: string;
  ingestToken?: string;
  sourceLocale?: string;
}): LandingSdkConfig | null {
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
    refreshIntervalMs: LANDING_REFRESH_INTERVAL_MS,
  };
}
