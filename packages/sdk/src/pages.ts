import type { GetServerSidePropsContext } from 'next';

import { resolveKeykitSetup, toCreateKeykitOptions } from './project-config.js';
import {
  resolveKeykitPage,
  type CreatePagesKeykitOptions,
  type KeykitPageProps,
} from './pages-request';

export type {
  CreatePagesKeykitOptions,
  KeykitPageProps,
} from './pages-request';
export { KeykitProvider } from './pages-provider.js';

/**
 * Pages Router setup.
 *
 * ```tsx
 * import { KeykitProvider } from '@keykithq/sdk/pages';
 * import { useKeykit } from '@keykithq/sdk/react';
 *
 * export { getServerSideProps } from '@keykithq/sdk/pages';
 *
 * export default function Page({ keykit }) {
 *   return (
 *     <KeykitProvider keykit={keykit}>
 *       <App />
 *     </KeykitProvider>
 *   );
 * }
 *
 * function App() {
 *   const { translate, locale, setLocale } = useKeykit();
 *   return <button onClick={() => setLocale('sv')}>{translate('save', 'Save')}</button>;
 * }
 * ```
 *
 * Reads `keykit.config.ts` from the project root, then `.keykit/catalog.json`.
 * `KEYKIT_API_KEY`, `KEYKIT_PROJECT_ID`, and `KEYKIT_BASE_URL` still come from
 * the environment when the config file omits them. Set `routing: 'path'` in
 * the config file so `/` is the default locale and `/sv` is Swedish.
 * `createKeykit({ ... })` overrides the file for one page.
 */
export function createKeykit(options: CreatePagesKeykitOptions = {}) {
  return {
    getServerSideProps(context: GetServerSidePropsContext) {
      return getServerSidePropsWith(options, context);
    },
  };
}

export function getServerSideProps(context: GetServerSidePropsContext) {
  return getServerSidePropsWith({}, context);
}

async function getServerSidePropsWith(
  explicit: CreatePagesKeykitOptions,
  context: GetServerSidePropsContext
) {
  const { env, ...projectOptions } = explicit;
  const setup = await resolveKeykitSetup(projectOptions);
  return resolveKeykitPage(
    {
      ...setup.config,
      ...toCreateKeykitOptions(setup.config),
      ...(env ? { env } : {}),
    },
    context
  );
}
