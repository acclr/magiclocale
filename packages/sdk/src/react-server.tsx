import * as React from 'react';
import { createTranslateApi } from './translate-api';
import {
  getKeykitRequestState,
  type KeykitRequestState,
} from './request-state.js';
import type { FlagEvaluationContext, FlagValue } from './types';

export type { KeykitTranslateApi } from './translate-api';

type ServerKeykit = {
  locale: string;
  isLoading: boolean;
  translate: (key: string, defaultText: string) => string;
  setLocale: (locale: string) => Promise<void>;
  refresh: () => Promise<void>;
  isEnabled: (key: string, fallback?: boolean) => boolean;
  getValue: (key: string, fallback?: FlagValue) => FlagValue;
  identify: (context: FlagEvaluationContext) => void;
  sourceCatalog?: Record<string, string>;
};

/**
 * Same call as the client hook. Next resolves this file for Server Components
 * via the `react-server` export condition.
 *
 * The component itself stays synchronous. `use()` suspends until the published
 * bundle for this request is loaded.
 */
export function useTranslate() {
  const keykit = useKeykit();
  return createTranslateApi(keykit);
}

export function useKeykit(): ServerKeykit {
  return keykitFromState(readPromise(getKeykitRequestState()));
}

export function useFlag(key: string, fallback: boolean | FlagValue = false) {
  const { isEnabled, getValue } = useKeykit();
  if (typeof fallback === 'boolean') {
    return isEnabled(key, fallback);
  }
  return getValue(key, fallback);
}

function keykitFromState(state: KeykitRequestState): ServerKeykit {
  return {
    locale: state.locale,
    isLoading: false,
    translate: (key, defaultText) => state.client.translate(key, defaultText),
    setLocale: async () => {
      throw new Error(
        'setLocale() is available in Client Components that render under KeykitProvider.'
      );
    },
    refresh: () => state.client.refreshTranslations(),
    isEnabled: (key, fallback = false) =>
      state.client.isEnabled(key, fallback),
    getValue: (key, fallback) =>
      fallback === undefined
        ? state.client.getValue(key)
        : state.client.getValue(key, fallback),
    identify: (context) => state.client.identify(context),
    sourceCatalog: state.sourceCatalog,
  };
}

function readPromise<T>(promise: Promise<T>): T {
  // Dynamic access: `use` exists on Next's server React, not in the public React 18 types.
  const use = (
    React as unknown as Record<
      string,
      (<Value>(value: Promise<Value>) => Value) | undefined
    >
  )['use'.trim()];
  if (typeof use !== 'function') {
    throw new Error(
      'useTranslate() in a Server Component requires the Next.js App Router runtime.'
    );
  }
  try {
    return use(promise);
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message.includes("reading 'use'")
    ) {
      throw new Error(
        'useTranslate() cannot run inside an async Server Component. Keep the component synchronous, or await getKeykit() from @keykithq/sdk/next.',
        { cause: error }
      );
    }
    throw error;
  }
}
