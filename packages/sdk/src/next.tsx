import { type ReactNode } from 'react';
import { KeykitNextClientProvider } from './next-client.js';
import {
  configureKeykitNext,
  getKeykitRequestState,
  type KeykitNextConfig,
} from './request-state.js';
import { createTranslateApi, type KeykitTranslateApi } from './translate-api';

export type { KeykitNextConfig } from './request-state.js';
export type { KeykitTranslateApi } from './translate-api';

export type KeykitServerTranslator = KeykitTranslateApi;

/**
 * App Router setup. `keykit.config.ts` and `.keykit/` are picked up
 * automatically. Call this only to override that file. Env vars
 * `KEYKIT_API_KEY`, `KEYKIT_PROJECT_ID`, and `KEYKIT_BASE_URL` fill any gaps.
 *
 * Server and Client Components then call `useTranslate()` from
 * `@keykithq/sdk/react`. Wrap the tree in `KeykitProvider` so client
 * components hydrate with the same locale and published bundle.
 */
export function createKeykitNext(config: KeykitNextConfig = {}) {
  configureKeykitNext(config);
  return { KeykitProvider, getKeykit };
}

export async function KeykitProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const state = await getKeykitRequestState();
  return (
    <KeykitNextClientProvider
      config={state.browserConfig}
      initialLocale={state.locale}
      initialBundle={state.initialBundle}
      cookieName={state.cookieName}
    >
      {children}
    </KeykitNextClientProvider>
  );
}

/** Async Server Components and metadata. Sync Server Components use `useTranslate()`. */
export async function getKeykit(): Promise<KeykitServerTranslator> {
  const state = await getKeykitRequestState();
  return createTranslateApi({
    locale: state.locale,
    sourceCatalog: state.sourceCatalog,
    translate: (key, defaultText) => state.client.translate(key, defaultText),
    isLoading: false,
    refresh: () => state.client.refreshTranslations(),
  });
}
