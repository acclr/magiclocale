/**
 * Apply committed Prisma migrations to a remote database (e.g. Vercel Postgres).
 *
 * Vercel does not run migrations during deploy unless you add that step yourself.
 * Run this once locally (or in CI) against production before signing up users.
 *
 * Usage:
 *
 *   # Recommended: non-pooling URL from Vercel → Storage → Postgres → Connect
 *   DATABASE_URL="postgresql://..." node scripts/migrate-production.js
 *
 *   # Or a local env file (never commit secrets)
 *   node --env-file .env.production scripts/migrate-production.js
 *
 *   # npm shortcut (same env vars)
 *   npm run db:migrate:production
 *
 * Vercel Postgres:
 *   Prefer POSTGRES_URL_NON_POOLING (direct) for migrations. Pooled URLs can fail
 *   on DDL. If only POSTGRES_URL_NON_POOLING is set, this script uses it as
 *   DATABASE_URL automatically.
 *
 * Optional:
 *   node scripts/migrate-production.js --seed   # run prisma db seed after migrate
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const args = process.argv.slice(2);
const shouldSeed = args.includes('--seed');
const forceLocal = args.includes('--force');

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }
  const nonPooling = process.env.POSTGRES_URL_NON_POOLING?.trim();
  if (nonPooling) {
    process.env.DATABASE_URL = nonPooling;
    console.log(
      'Using POSTGRES_URL_NON_POOLING as DATABASE_URL (recommended for migrations).'
    );
    return nonPooling;
  }
  const postgresUrl = process.env.POSTGRES_URL?.trim();
  if (postgresUrl) {
    process.env.DATABASE_URL = postgresUrl;
    console.warn(
      'Warning: Using POSTGRES_URL (pooled). If migrate fails, set DATABASE_URL to POSTGRES_URL_NON_POOLING.'
    );
    return postgresUrl;
  }
  return null;
}

function maskDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return '(invalid URL)';
  }
}

function looksLikeLocal(url) {
  return /localhost|127\.0\.0\.1|:55432\b/i.test(url);
}

function runNpmScript(scriptName) {
  const result = spawnSync('npm', ['run', scriptName], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
  console.error(`
DATABASE_URL is not set.

Set it to your Vercel Postgres connection string, then re-run:

  DATABASE_URL="postgresql://..." npm run db:migrate:production

Or pull env from Vercel and run:

  vercel env pull .env.production.local
  node --env-file .env.production.local scripts/migrate-production.js
`);
  process.exit(1);
}

if (looksLikeLocal(databaseUrl) && !forceLocal) {
  console.error(`
DATABASE_URL looks like a local database:
  ${maskDatabaseUrl(databaseUrl)}

To migrate production, pass your Vercel Postgres URL.
To migrate local anyway, re-run with --force.
`);
  process.exit(1);
}

console.log(`Target database: ${maskDatabaseUrl(databaseUrl)}`);
console.log('Running: prisma migrate deploy\n');

runNpmScript('db:migrate');

if (shouldSeed) {
  console.log('\nRunning: prisma db seed\n');
  const seedResult = spawnSync('npx', ['prisma', 'db', 'seed'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
  if (seedResult.status !== 0) {
    process.exit(seedResult.status ?? 1);
  }
}

console.log('\nDone. Migrations applied successfully.');
