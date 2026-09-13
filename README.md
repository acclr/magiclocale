# Magilocale

Magilocale is a team-based translation platform for application copy. The
dashboard manages projects, locales, translation status, and human review,
while `@magilocale/sdk` discovers source keys and loads translated bundles at
runtime.

## Architecture

- **Next.js dashboard and API** — team-authenticated project management lives
  under `/teams/:slug`; bearer-authenticated SDK endpoints live under
  `/api/v1`.
- **PostgreSQL and Prisma** — projects, source keys, translations, ownership,
  and review state are persisted in Postgres.
- **Translation domain services** — project and translation rules are kept out
  of UI and route handlers. The OpenAI translator and Prisma repository are
  injected behind domain interfaces.
- **OpenAI-compatible translation provider** — automatic translations use the
  configured model, requesting temperature `0` when the model allows it.
- **Workspace SDK** — `packages/sdk` contains framework-neutral, React, and
  Next.js entry points.

The central ownership rule is:

> Once a human saves a translation, automatic AI never overwrites it.

A dashboard edit immediately persists `source: "manual"` and
`aiLocked: true`. If source text later changes, the human value remains
unchanged and its status becomes `needs-review`. Suggestions do not change
ownership until accepted.

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 16 (or Docker Compose)
- An OpenAI API key and an available chat-completions model for AI translation

## Local setup

1. Install all root and workspace dependencies:

   ```bash
   npm install
   ```

2. Start the included Postgres service:

   ```bash
   docker compose up -d db
   ```

   The compose database uses
   `postgresql://admin:admin@localhost:55432/saas-starter-kit`.

3. Copy `.env.example` to `.env`, generate `NEXTAUTH_SECRET`, and set the
   required values:

   ```bash
   openssl rand -base64 32
   ```

   At minimum configure `DATABASE_URL`, `NEXTAUTH_SECRET`, `APP_URL`,
   `NEXTAUTH_URL`, `OPENAI_API_KEY`, and `OPENAI_MODEL`. Use a model that
   supports Chat Completions and is enabled for your account. Set
   `OPENAI_BASE_URL` only for an OpenAI-compatible provider.

4. Apply committed migrations and generate the Prisma client:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

   For a new development migration, use `npx prisma migrate dev`. Production
   deployments should use `prisma migrate deploy`, not `prisma db push`.

5. Start the dashboard:

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:4002`.

## Create a team, project, and API key

1. Sign up or sign in, then create or select a team.
2. Open **Translation Projects**, create a project, and choose its source
   locale.
3. Add each target locale from the project workspace.
4. Open **Settings → API Keys** and create a key.

The API key is shown only when created. It authenticates SDK requests for
projects owned by the same team. Keep server-side keys in environment
variables. Browser use exposes the key to that application’s users, so set
`MAGILOCALE_ALLOWED_ORIGIN` to the exact browser origin and issue a dedicated
team key appropriate for that exposure.

## SDK workspace

Build and verify the SDK from the repository root:

```bash
npm run sdk:check-types
npm run sdk:test
npm run sdk:build
```

The workspace package can be referenced by another npm workspace as
`"@magilocale/sdk": "workspace:*"`. A basic client configuration is:

```ts
import translate, { configureMagicLocale, flush } from '@magilocale/sdk';

configureMagicLocale({
  baseUrl: 'http://localhost:4002',
  projectId: process.env.MAGILOCALE_PROJECT_ID!,
  ingestToken: process.env.MAGILOCALE_API_KEY!,
  sourceLocale: 'en',
  locale: 'sv',
});

const label = translate('settings.save', 'Save changes');
await flush();
```

`translate(key, defaultText)` returns the current bundle value or the source
text fallback, queues source-key ingestion, and batches sync requests. React
consumers can import `MagiLocaleProvider` and `useMagiLocale` from
`@magilocale/sdk/react`. Next.js App Router consumers can use
`createMagiLocaleNext` from `@magilocale/sdk/next`.

## Localize the Magilocale landing page and dashboard

This app is a customer of itself. The public homepage uses
`translate(key, defaultText)` from `@magilocale/sdk`. The signed-in dashboard
keeps `next-i18next` `t('key')` calls and bridges them to a second dedicated
project so those keys show up in the translation workspace.

1. In **Translation Projects**, create a project such as `Landing page` and
   another such as `Dashboard`.
2. Add each locale you want to manage (for example `sv` and `fr`).
3. Create a team API key for each project.
4. Set the matching values in `.env`, then restart the app:

   - `MAGILOCALE_LANDING_PROJECT_ID` and `MAGILOCALE_LANDING_API_KEY`
   - `MAGILOCALE_DASHBOARD_PROJECT_ID` and `MAGILOCALE_DASHBOARD_API_KEY`

Visiting `/` discovers `landing.*` keys automatically. Visiting a dashboard
screen discovers that screen's `t()` keys (for example `back-to-projects`)
from `locales/en/common.json`. Edit them in the matching project; bundles
refresh about every 30 seconds. Without those env values the UI still
renders English source text.

## Public SDK endpoints

Both endpoints require `Authorization: Bearer <API_KEY>`.

- `POST /api/v1/projects/:projectId/keys/sync`

  ```json
  {
    "keys": [{ "key": "settings.save", "sourceText": "Save changes" }]
  }
  ```

- `GET /api/v1/projects/:projectId/translations?locale=sv`

  Returns the project ID, requested locale, source locale, translation map,
  and bundle version. Responses use `Cache-Control: no-store`.

Browser requests are allowed only from `MAGILOCALE_ALLOWED_ORIGIN`. Server-side
requests without an `Origin` header are supported.

## Commands

```bash
npm run dev                 # Next.js development server on port 4002
npm run build               # Prisma generate plus Next production build
npm run build-ci            # Explicit CI production build
npm run db:migrate          # Apply committed Prisma migrations
npm run db:validate         # Validate the Prisma schema
npm run check-locale        # Verify locale files have matching keys
npm run check-format        # Check Prettier formatting
npm run check-lint          # Run ESLint
npm run check-types         # Run root TypeScript checks
npm test                    # Run root Jest tests
npm run test:e2e            # Run Playwright
npm run sdk:check-types     # Type-check @magilocale/sdk
npm run sdk:test            # Run SDK Vitest tests
npm run sdk:build           # Build SDK ESM/CJS/types
npm run stripe:ensure-plans # Create $5 Starter and $50 Enterprise Stripe prices
```

## Billing

Magilocale has two monthly plans:

- **Starter** — $5/mo, standard usage, up to 4 languages per project
- **Enterprise** — $50/mo, required once a project needs 5 or more languages

Create the Stripe products and copy the printed price IDs into
`STRIPE_STARTER_PRICE_ID` and `STRIPE_ENTERPRISE_PRICE_ID`:

```bash
npm run stripe:ensure-plans
```

Checkout lives at **Settings → Billing**. Adding a 5th locale is blocked until
the team is on Enterprise.

## Testing the production flow

`tests/e2e/translations/production-flow.spec.ts` authenticates with the
existing Playwright account setup, creates a project and locale through the
dashboard, uses an injected deterministic translator to ingest a key, saves a
manual translation in the browser, changes the source, verifies
`needs-review`, and fetches the real bearer-authenticated bundle endpoint.
This avoids external model calls while exercising the production persistence,
ownership, UI, and public API boundaries.

Playwright requires a migrated test database, the existing authentication
environment, a production build, and an installed Chromium browser:

```bash
npx playwright install chromium
npx playwright test tests/e2e/translations/production-flow.spec.ts
```

## Production deployment

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Configure authentication URLs/secrets and any enabled auth providers.
3. Configure `OPENAI_API_KEY`, `OPENAI_MODEL`, and optionally
   `OPENAI_BASE_URL`.
4. Set `MAGILOCALE_ALLOWED_ORIGIN` to the deployed client origin.
5. Run `npx prisma migrate deploy`.
6. Build with `npm run build-ci` and start with `npm run start`.

Run the app and migration commands from the same release so generated Prisma
types and the deployed schema stay aligned. Never commit `.env` or generated
API keys.
