# @keykithq/cli

Keykit command line. It pulls published catalogs, scans source keys, and applies key renames on your machine. Keykit never writes your filesystem from the server.

## Install

```bash
npm install @keykithq/cli
```

Use it with `@keykithq/sdk`. Both read `keykit.config.ts` (or `keykit.config.js` / `keykit.config.mjs`) from the project root.

```ts
import { defineKeykitConfig } from '@keykithq/sdk';

export default defineKeykitConfig({
  delivery: 'static',
  sourceLocale: 'en',
  locales: ['en', 'sv'],
});
```

Credentials come from the config file or from the environment:

```bash
KEYKIT_API_KEY=
KEYKIT_PROJECT_ID=
KEYKIT_BASE_URL=https://www.keykit.dev
```

A flag overrides the environment, which overrides `keykit.config.ts`.

## pull

```bash
npx @keykithq/cli pull
```

Writes `.keykit/catalog.json` and one `.keykit/<locale>.json` per published locale. Set `delivery: 'static'` in `keykit.config.ts` and the SDK reads that folder without a fetch on page load. Commit `.keykit`, then run `pull` again after you publish.

```bash
npx @keykithq/cli pull --out .keykit --environment production --version 3
```

`--out` overrides the folder (`dir` in the config, otherwise `.keykit`). `--base-url`, `--project-id`, and `--token` override the environment and the config file.

## scan

```bash
npx @keykithq/cli scan --root .
```

Prints `t('key', 'Source text')` and `translate('key', 'Source text')` calls found in source files, including ones that have not run yet. The SDK only ingests keys that execute.

## rewrite

```bash
npx @keykithq/cli rewrite --file migration.json --root .
```

Applies a key rename or move from a migration file downloaded in the Keykit UI. Review the diff and commit it. Mark the migration complete in Keykit after the rewrite.

## flatten-json

```bash
npx @keykithq/cli flatten-json --file messages.json
```

Prints nested locale JSON as a flat list of `{ key, sourceText }` pairs.

Docs: [Keykit](https://keykit.dev)
