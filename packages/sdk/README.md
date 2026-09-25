# @keykithq/sdk

Official Keykit client for ingesting source keys and loading translation bundles.

## Install

```bash
npm install @keykithq/sdk
```

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
</KeykitProvider>
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
