# @keykithq/sdk

Official Keykit client for ingesting source keys and loading translation bundles.

## Install

```bash
npm install @keykithq/sdk
```

## Quick start

```ts
import translate, { configureKeykit, flush } from '@keykithq/sdk';

configureKeykit({
  baseUrl: 'https://your-keykit-instance.com',
  projectId: process.env.KEYKIT_PROJECT_ID!,
  ingestToken: process.env.KEYKIT_API_KEY!,
  sourceLocale: 'en',
  locale: 'en',
});

const label = translate('settings.save', 'Save changes');
await flush();
```

## React

Wrap your app in `KeykitProvider`, then call `useTranslate` in client components:

```tsx
'use client';

import { KeykitProvider, useTranslate } from '@keykithq/sdk/react';

function SaveButton() {
  const { t } = useTranslate();
  return <button>{t('settings.save', 'Save changes')}</button>;
}
```

Pass `sourceCatalog` in config when you want `t('settings.save')` without a second
argument (for example a flat JSON catalog from a previous i18n setup).

Keys are ingested when code runs: only strings on routes you visit are discovered
at runtime. To list keys in files that are not executed yet, run
`npx @keykit/cli scan --root .` in the app repository.

- React: `@keykithq/sdk/react` (`KeykitProvider`, `useTranslate`, `useKeykit`)
- Next.js App Router: `@keykithq/sdk/next`

Docs: [Keykit](https://keykit.dev) (replace with your production URL).
