'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MagicLocaleClient } from './client';
import type { MagicLocaleConfig, TranslationBundle } from './types';

export type MagiLocaleContextValue = {
  locale: string;
  isLoading: boolean;
  translate: (key: string, defaultText: string) => string;
  setLocale: (locale: string) => Promise<void>;
  refresh: () => Promise<void>;
  isEnabled: (key: string, fallback?: boolean) => boolean;
  getValue: (
    key: string,
    fallback?: import('./types').FlagValue
  ) => import('./types').FlagValue;
  identify: (context: import('./types').FlagEvaluationContext) => void;
};

export const MagiLocaleContext = createContext<MagiLocaleContextValue | null>(
  null
);

export type MagiLocaleProviderProps = {
  config: MagicLocaleConfig;
  initialLocale?: string;
  initialBundle?: TranslationBundle;
  cookieName?: string;
  onServerRefresh?: () => void;
  children: ReactNode;
};

export function MagiLocaleProvider({
  config,
  initialLocale,
  initialBundle,
  cookieName = 'magilocale-locale',
  onServerRefresh,
  children,
}: MagiLocaleProviderProps) {
  const clientRef = useRef<MagicLocaleClient | null>(null);
  const [, setRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  if (!clientRef.current) {
    clientRef.current = new MagicLocaleClient({
      ...config,
      locale: initialLocale ?? config.locale ?? config.sourceLocale ?? 'en',
      initialBundle: initialBundle ?? config.initialBundle,
    });
  }

  const client = clientRef.current;
  const locale = client.getLocale();

  useEffect(() => {
    const unsubscribe = client.subscribe(() => {
      setRevision((revision) => revision + 1);
      onServerRefresh?.();
    });
    void client.flush();
    return () => {
      unsubscribe();
      client.dispose();
    };
  }, [client, onServerRefresh]);

  const translate = useCallback(
    (key: string, defaultText: string) => client.translate(key, defaultText),
    [client]
  );
  const setLocale = useCallback(
    async (nextLocale: string) => {
      if (nextLocale === client.getLocale()) {
        return;
      }
      const previousLocale = client.getLocale();
      setIsLoading(true);
      persistLocale(cookieName, nextLocale);
      try {
        await client.setLocale(nextLocale);
      } catch (error) {
        persistLocale(cookieName, previousLocale);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [client, cookieName]
  );
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        client.refreshTranslations(),
        client.refreshFlags(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [client]);
  const isEnabled = useCallback(
    (key: string, fallback = false) => client.isEnabled(key, fallback),
    [client]
  );
  const getValue = useCallback(
    (key: string, fallback?: import('./types').FlagValue) =>
      client.getValue(key, fallback),
    [client]
  );
  const identify = useCallback(
    (context: import('./types').FlagEvaluationContext) =>
      client.identify(context),
    [client]
  );
  const value = useMemo<MagiLocaleContextValue>(
    () => ({
      locale,
      isLoading,
      translate,
      setLocale,
      refresh,
      isEnabled,
      getValue,
      identify,
    }),
    [
      getValue,
      identify,
      isEnabled,
      isLoading,
      locale,
      refresh,
      setLocale,
      translate,
    ]
  );

  return (
    <MagiLocaleContext.Provider value={value}>
      {children}
    </MagiLocaleContext.Provider>
  );
}

export function useMagiLocale(): MagiLocaleContextValue {
  const context = useContext(MagiLocaleContext);
  if (!context) {
    throw new Error('useMagiLocale must be used inside MagiLocaleProvider.');
  }
  return context;
}

export function useFlag(
  key: string,
  fallback: boolean | import('./types').FlagValue = false
) {
  const { isEnabled, getValue } = useMagiLocale();
  if (typeof fallback === 'boolean') {
    return isEnabled(key, fallback);
  }
  return getValue(key, fallback);
}

export { MagiLocaleProvider as FlagProvider };

function persistLocale(cookieName: string, locale: string): void {
  document.cookie =
    `${encodeURIComponent(cookieName)}=${encodeURIComponent(locale)}; ` +
    'Path=/; Max-Age=31536000; SameSite=Lax';
}
