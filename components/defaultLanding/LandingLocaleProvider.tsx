import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { KeykitProvider, useKeykit } from '@keykithq/sdk/react';

import type { LandingLocalePageProps } from '@/lib/landing-locale';

export type LandingI18n = {
  locale: string;
  locales: string[];
  isLoading: boolean;
  translate: (key: string, defaultText: string) => string;
  setLocale: (locale: string) => Promise<void>;
};

const LandingI18nContext = createContext<LandingI18n | null>(null);

function identityTranslate(_key: string, defaultText: string): string {
  return defaultText;
}

function FallbackLandingI18n({
  locale,
  locales,
  children,
}: {
  locale: string;
  locales: string[];
  children: ReactNode;
}) {
  const value = useMemo<LandingI18n>(
    () => ({
      locale,
      locales,
      isLoading: false,
      translate: identityTranslate,
      setLocale: async () => undefined,
    }),
    [locale, locales]
  );

  return (
    <LandingI18nContext.Provider value={value}>
      {children}
    </LandingI18nContext.Provider>
  );
}

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
  if (!landing.config) {
    return (
      <FallbackLandingI18n locale={landing.locale} locales={landing.locales}>
        {children}
      </FallbackLandingI18n>
    );
  }

  return (
    <KeykitProvider
      config={landing.config}
      initialLocale={landing.locale}
      initialBundle={landing.initialBundle ?? undefined}
    >
      <BridgedLandingI18n locales={landing.locales}>
        {children}
      </BridgedLandingI18n>
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
