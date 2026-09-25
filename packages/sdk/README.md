# @keykithq/sdk

Official Keykit client for ingesting source keys and loading translation bundles.

## Install

```bash
npm install @keykithq/sdk
```

Add the project id and API key to `.env`:

```bash
KEYKIT_API_KEY=
KEYKIT_PROJECT_ID=
KEYKIT_BASE_URL=https://www.keykit.dev
```

## Pages Router

```tsx
import { createKeykit, KeykitProvider } from '@keykithq/sdk/pages';
import { useKeykit } from '@keykithq/sdk/react';

const { getServerSideProps } = createKeykit({
  routing: 'path',
  defaultLocale: 'en',
  locales: ['en', 'sv', 'dk'],
});

export { getServerSideProps };

export default function Page({ keykit }) {
  return (
    <KeykitProvider keykit={keykit}>
      <SaveButton />
    </KeykitProvider>
  );
}

function SaveButton() {
  const { translate, locale, setLocale } = useKeykit();
  return (
    <button onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}>
      {translate('settings.save', 'Save changes')}
    </button>
  );
}
```

With `routing: 'path'`, `/` and `/en` are English, `/sv` is Swedish, and `/dk` is Danish. `setLocale` navigates to that path. Put the page at `pages/[[...landing]].tsx` so those URLs share one file. Add further pages with `pages: ['pricing']` (`/pricing`, `/sv/pricing`).

`KEYKIT_API_KEY` stays on the server. `NEXT_PUBLIC_KEYKIT_API_KEY` is only needed if the browser should call Keykit directly.

## Delivery modes

### 1. Live fetch

The SDK loads published translations when the page (or server) starts. A
reload picks up the latest published bundle. Add the browser origin in
**Project settings → Allowed browser origins** if this runs in the browser.

```ts
import { KeykitProvider, useTranslate } from '@keykithq/sdk/react';

<KeykitProvider
  config={{
    delivery: 'live',
    baseUrl: 'https://www.keykit.dev',
    projectId: process.env.NEXT_PUBLIC_KEYKIT_PROJECT_ID!,
    ingestToken: process.env.NEXT_PUBLIC_KEYKIT_API_KEY!,
    sourceLocale: 'en',
  }}
>
  <App />
</KeykitProvider>
```

Server-side and CLI calls do not need an allowed origin. Prefer keeping the
API key on the server (`createKeykitNext` or `loadTranslationBundle`) so the
browser never sees it.

### 2. Local JSON (no fetch on page load)

Pull published translations into files, commit them, and pass them to the SDK:

```bash
npx @keykit/cli pull --out ./locales \
  --base-url https://www.keykit.dev \
  --project-id "$KEYKIT_PROJECT_ID" \
  --token "$KEYKIT_API_KEY"
```

```tsx
import catalog from './locales/catalog.json';
import { KeykitProvider, useTranslate } from '@keykithq/sdk/react';

<KeykitProvider
  config={{
    delivery: 'static',
    sourceLocale: catalog.sourceLocale,
    catalogs: catalog.locales,
  }}
>
  <App />
</KeykitProvider>;
```

`useTranslate()` reads the local maps. Publish in the dashboard, then run
`keykit pull` again (typically in CI) to refresh the files.

## React

```tsx
'use client';

import { useTranslate } from '@keykithq/sdk/react';

function SaveButton() {
  const { t } = useTranslate();
  return <button>{t('settings.save', 'Save changes')}</button>;
}
```

Pass `sourceCatalog` when you want `t('settings.save')` without a second
argument (for example a flat JSON catalog from a previous i18n setup).

Keys are ingested when code runs and an ingest token is configured. To list
keys in files that are not executed yet, run `npx @keykit/cli scan --root .`.

- React: `@keykithq/sdk/react` (`KeykitProvider`, `useTranslate`, `useKeykit`)
- Next.js App Router: `@keykithq/sdk/next`

Docs: [Keykit](https://keykit.dev)
