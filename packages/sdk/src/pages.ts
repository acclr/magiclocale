import type { GetServerSidePropsContext } from 'next';

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
 * import { createKeykit, KeykitProvider } from '@keykithq/sdk/pages';
 * import { useKeykit } from '@keykithq/sdk/react';
 *
 * const { getServerSideProps } = createKeykit();
 * export { getServerSideProps };
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
 * Reads `KEYKIT_API_KEY`, `KEYKIT_PROJECT_ID`, and `KEYKIT_BASE_URL` from the
 * environment. Set `routing: 'path'` so `/` is the default locale and `/sv`
 * is Swedish.
 */
export function createKeykit(options: CreatePagesKeykitOptions = {}) {
  return {
    getServerSideProps(context: GetServerSidePropsContext) {
      return resolveKeykitPage(options, context);
    },
  };
}
