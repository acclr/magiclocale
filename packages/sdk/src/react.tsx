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
import { KeykitClient } from './client';
import {
  createTranslateApi,
  type KeykitTranslateApi,
  type TranslateFn,
} from './translate-api';
import type { KeykitConfig, TranslationBundle } from './types';

export type KeykitContextValue = {
  locale: string;
  isLoading: boolean;
  t: KeykitTranslateApi['t'];
  translate: TranslateFn;
  setLocale: (locale: string) => Promise<void>;
  refresh: () => Promise<void>;
  isEnabled: (key: string, fallback?: boolean) => boolean;
  getValue: (
    key: string,
    fallback?: import('./types').FlagValue
  ) => import('./types').FlagValue;
  identify: (context: import('./types').FlagEvaluationContext) => void;
  sourceCatalog?: Record<string, string>;
};

export const KeykitContext = createContext<KeykitContextValue | null>(null);

export type KeykitProviderProps = {
  config: KeykitConfig;
  initialLocale?: string;
  initialBundle?: TranslationBundle;
  cookieName?: string;
  onServerRefresh?: () => void;
  /**
   * Return `false` to store the locale cookie and fetch that locale's bundle.
   * Any other return value means the callback fully handled the change.
   */
  onSetLocale?: (locale: string) => Promise<boolean | void> | boolean | void;
  children: ReactNode;
};

export function KeykitProvider({
  config,
  initialLocale,
  initialBundle,
  cookieName = 'keykit-locale',
  onServerRefresh,
  onSetLocale,
  children,
}: KeykitProviderProps) {
  const clientRef = useRef<KeykitClient | null>(null);
  const [revision, setRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  if (!clientRef.current) {
    clientRef.current = new KeykitClient({
      ...config,
      locale: initialLocale ?? config.locale ?? config.sourceLocale ?? 'en',
      initialBundle: initialBundle ?? config.initialBundle,
      // Page views read catalogs. `keykit sync` registers keys during development.
      ingest: false,
    });
  }

  const client = clientRef.current;
  const locale = client.getLocale();

  useEffect(() => {
    const unsubscribe = client.subscribe(() => {
      setRevision((revision) => revision + 1);
      onServerRefresh?.();
    });
    void client.flush().catch((error: unknown) => {
      const normalized =
        error instanceof Error ? error : new Error(String(error));
      if (config.onError) {
        config.onError(normalized);
        return;
      }
      console.warn('[Keykit]', normalized.message);
    });
    return () => {
      unsubscribe();
      client.dispose();
    };
  }, [client, onServerRefresh]);

  const lookup = useCallback(
    (key: string, defaultText: string) => client.translate(key, defaultText),
    [client]
  );
  const setLocale = useCallback(
    async (nextLocale: string) => {
      if (nextLocale === client.getLocale()) {
        return;
      }
      setIsLoading(true);
      try {
        if (onSetLocale) {
          const handled = await onSetLocale(nextLocale);
          if (handled !== false) {
            return;
          }
        }
        const previousLocale = client.getLocale();
        persistLocale(cookieName, nextLocale);
        try {
          await client.setLocale(nextLocale);
        } catch (error) {
          persistLocale(cookieName, previousLocale);
          throw error;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [client, cookieName, onSetLocale]
  );
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await client.refreshTranslations();
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
  const value = useMemo<KeykitContextValue>(() => {
    void revision;
    const api = createTranslateApi({
      locale,
      translate: lookup,
      sourceCatalog: config.sourceCatalog,
      isLoading,
      setLocale,
      refresh,
    });
    return {
      locale,
      isLoading,
      t: api.t,
      translate: api.translate,
      setLocale,
      refresh,
      isEnabled,
      getValue,
      identify,
      sourceCatalog: config.sourceCatalog,
    };
  }, [
    config.sourceCatalog,
    getValue,
    identify,
    isEnabled,
    isLoading,
    locale,
    lookup,
    refresh,
    revision,
    setLocale,
  ]);

  return (
    <KeykitContext.Provider value={value}>{children}</KeykitContext.Provider>
  );
}

export function useKeykit(): KeykitContextValue {
  const context = useContext(KeykitContext);
  if (!context) {
    throw new Error('useKeykit must be used inside KeykitProvider.');
  }
  return context;
}

export function useTranslate() {
  const { t, translate, locale, isLoading, setLocale, refresh } = useKeykit();

  return useMemo(
    () => ({ t, translate, locale, isLoading, setLocale, refresh }),
    [isLoading, locale, refresh, setLocale, t, translate]
  );
}

export function useFlag(
  key: string,
  fallback: boolean | import('./types').FlagValue = false
) {
  const { isEnabled, getValue } = useKeykit();
  if (typeof fallback === 'boolean') {
    return isEnabled(key, fallback);
  }
  return getValue(key, fallback);
}

export { KeykitProvider as FlagProvider };

function persistLocale(cookieName: string, locale: string): void {
  document.cookie =
    `${encodeURIComponent(cookieName)}=${encodeURIComponent(locale)}; ` +
    'Path=/; Max-Age=31536000; SameSite=Lax';
}
