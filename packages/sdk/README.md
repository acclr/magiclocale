# @keykithq/sdk

Official Keykit client. It discovers source keys and loads published translations.

## Install

```bash
npm install @keykithq/sdk
```

The CLI is a separate package: `@keykithq/cli`.

## Configure

Add credentials to `.env`. The API key stays on the server.

```bash
KEYKIT_API_KEY=
KEYKIT_PROJECT_ID=
KEYKIT_BASE_URL=https://www.keykit.dev
```

`NEXT_PUBLIC_KEYKIT_API_KEY` is only needed when the browser calls Keykit directly. If it does, add that site under **Project settings → Allowed browser origins**.

Put project settings in `keykit.config.ts` at the root of the app. `keykit.config.js` and `keykit.config.mjs` work the same way. The SDK and the CLI load this file. You do not call `createKeykit()` yourself.

```ts
import { defineKeykitConfig } from '@keykithq/sdk';

export default defineKeykitConfig({
  delivery: 'live',
  sourceLocale: 'en',
  defaultLocale: 'en',
  locales: ['en', 'sv'],
  routing: 'path',
  pages: ['pricing'],
});
```

A CLI flag overrides the environment, which overrides `keykit.config.ts`.

`delivery: 'live'` (the default when an API key and project id are set) loads the published bundle on each request. A dashboard publish shows up on the next render in server and client components.

`delivery: 'static'` reads `.keykit/catalog.json` from `keykit pull` and does not fetch translations on page load.

## App Router

```tsx
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
```

Server Components and Client Components call the same hook from `@keykithq/sdk/react`:

```tsx
import { useTranslate } from '@keykithq/sdk/react';

export default function Page() {
  const { t, locale } = useTranslate();
  return <h1 lang={locale}>{t('home.title', 'Welcome')}</h1>;
}
```

```tsx
'use client';

import { useTranslate } from '@keykithq/sdk/react';

export function SaveButton() {
  const { t, locale, setLocale } = useTranslate();
  return (
    <button onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}>
      {t('settings.save', 'Save changes')}
    </button>
  );
}
```

`locale` comes from the `keykit-locale` cookie, then the `x-keykit-locale` header, then `Accept-Language` when `locales` is set in `keykit.config.ts`.

Keep Server Components that call `useTranslate()` synchronous. In an async Server Component, use `await getKeykit()` from `@keykithq/sdk/next`.

`setLocale()` updates the cookie and the in-memory bundle. Call it from a Client Component.

## Pages Router

```tsx
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
}
```

With `routing: 'path'`, `/` and `/en` are the default locale and `/sv` is Swedish. Put the page at `pages/[[...landing]].tsx` so those URLs share one file. `pages: ['pricing']` adds `/pricing` and `/sv/pricing`.

## Local JSON

```ts
export default defineKeykitConfig({
  delivery: 'static',
});
```

```bash
npx @keykithq/cli pull
```

That writes `.keykit/catalog.json` and one `.keykit/<locale>.json` per locale. The SDK reads the catalog on its own. Commit `.keykit`, publish in the dashboard, then run `keykit pull` again (typically in CI) to refresh the files.

`t('home.title', 'Welcome')` uses the second argument as source text. If you omit it, the SDK uses `sourceCatalog` from the config, or the source-locale map inside `.keykit/catalog.json`.

## Keys

Calls to `t()` and `translate()` are ingested when that code runs and an API key is configured. To list calls that have not executed yet:

```bash
npx @keykithq/cli scan --root .
```

- React: `@keykithq/sdk/react` (`useTranslate`, `useKeykit`, `KeykitProvider`)
- Next.js App Router: `@keykithq/sdk/next`
- Next.js Pages Router: `@keykithq/sdk/pages`

Docs: [Keykit](https://keykit.dev)
