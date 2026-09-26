import React from 'react';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { KeykitProvider, useKeykit } from '@keykithq/sdk/react';

import type { LandingLocalePageProps } from '@/lib/landing-locale';
import { ensureStaticCatalogs } from '@/lib/self-hosted-locale';

export type LandingI18n = {
  locale: string;
  locales: string[];
  isLoading: boolean;
  translate: (key: string, defaultText: string) => string;
  setLocale: (locale: string) => Promise<void>;
};

const LandingI18nContext = createContext<LandingI18n | null>(null);

function BridgedLandingI18n({
  locales,
  children,
}: {
  locales: string[];
  children: ReactNode;
}) {
  const keykit = useKeykit();
  const value = useMemo<LandingI18n>(
    () => ({
      locale: keykit.locale,
      locales,
      isLoading: keykit.isLoading,
      translate: keykit.translate,
      setLocale: keykit.setLocale,
    }),
    [locales, keykit]
  );

  return (
    <LandingI18nContext.Provider value={value}>
      {children}
    </LandingI18nContext.Provider>
  );
}

export function LandingLocaleProvider({
  landing,
  children,
}: {
  landing: LandingLocalePageProps;
  children: ReactNode;
}) {
  const locale = landing.locale || 'en';
  const locales = landing.locales?.length ? landing.locales : [locale];
  const catalogs = ensureStaticCatalogs(landing.config?.catalogs, locale);
  const config = {
    baseUrl: landing.config?.baseUrl ?? '',
    projectId: landing.config?.projectId ?? '',
    ingestToken: landing.config?.ingestToken ?? '',
    sourceLocale: landing.config?.sourceLocale ?? locale,
    delivery: 'static' as const,
    catalogs,
    refreshIntervalMs: 0,
    ...(landing.config?.sourceCatalog
      ? { sourceCatalog: landing.config.sourceCatalog }
      : {}),
  };

  return (
    <KeykitProvider
      config={config}
      initialLocale={locale}
      initialBundle={landing.initialBundle ?? undefined}
    >
      <BridgedLandingI18n locales={locales}>{children}</BridgedLandingI18n>
    </KeykitProvider>
  );
}

export function useLandingI18n(): LandingI18n {
  const context = useContext(LandingI18nContext);
  if (!context) {
    throw new Error(
      'useLandingI18n must be used inside LandingLocaleProvider.'
    );
  }
  return context;
}
