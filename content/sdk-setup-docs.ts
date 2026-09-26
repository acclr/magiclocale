/** Copy-paste setup shown on a project's settings page. */
export function sdkSetupSnippets(projectId: string) {
  return {
    install: `npm install @keykithq/sdk @keykithq/cli`,
    env: `# .env
KEYKIT_API_KEY=
KEYKIT_PROJECT_ID=${projectId}
KEYKIT_BASE_URL=https://www.keykit.dev`,
    config: `// keykit.config.ts (keykit.config.js and keykit.config.mjs also work)
import { defineKeykitConfig } from '@keykithq/sdk';

export default defineKeykitConfig({
  // 'live' loads the published bundle on each request.
  // 'static' reads .keykit/catalog.json from \`keykit pull\`.
  delivery: 'live',
  sourceLocale: 'en',
  defaultLocale: 'en',
  locales: ['en', 'sv'],
  // Pages Router only. \`/\` and \`/en\` are English, \`/sv\` is Swedish.
  routing: 'path',
});`,
    appRouter: `// app/layout.tsx
import { KeykitProvider } from '@keykithq/sdk/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <KeykitProvider>{children}</KeykitProvider>
      </body>
    </html>
  );
}

// Server Component — keep this component synchronous
import { useTranslate } from '@keykithq/sdk/react';

export default function Page() {
  const { t, locale } = useTranslate();
  return <h1 lang={locale}>{t('home.title', 'Welcome')}</h1>;
}

// Client Component
'use client';
import { useTranslate } from '@keykithq/sdk/react';

export function SaveButton() {
  const { t, locale, setLocale } = useTranslate();
  return (
    <button onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}>
      {t('settings.save', 'Save changes')}
    </button>
  );
}`,
    pagesRouter: `// pages/[[...landing]].tsx
import { KeykitProvider } from '@keykithq/sdk/pages';
import { useTranslate } from '@keykithq/sdk/react';

export { getServerSideProps } from '@keykithq/sdk/pages';

export default function Page({ keykit }) {
  return (
    <KeykitProvider keykit={keykit}>
      <SaveButton />
    </KeykitProvider>
  );
}

function SaveButton() {
  const { t, locale, setLocale } = useTranslate();
  return (
    <button onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}>
      {t('settings.save', 'Save changes')}
    </button>
  );
}`,
    cli: `npx @keykithq/cli pull
# writes .keykit/catalog.json and .keykit/<locale>.json

npx @keykithq/cli scan --root .
# lists t() / translate() calls that have not run yet

npx @keykithq/cli rewrite --file migration.json --root .
# applies a key rename downloaded from Keykit

npx @keykithq/cli flatten-json --file messages.json`,
  };
}
