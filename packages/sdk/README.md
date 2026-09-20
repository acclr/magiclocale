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

- React: `@keykithq/sdk/react`
- Next.js App Router: `@keykithq/sdk/next`

Docs: [Keykit](https://keykit.dev) (replace with your production URL).
