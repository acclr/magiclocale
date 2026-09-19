/**
 * Pull production env from Vercel, then apply Prisma migrations.
 *
 * Prerequisites (one-time):
 *   1. npm install   (installs the `vercel` CLI from devDependencies)
 *   2. npx vercel login
 *   3. npx vercel link   (choose your team + the magiclocale project)
 *
 * Usage:
 *   npm run db:migrate:vercel
 *
 * Creates `.env.production.local` (gitignored) with pulled secrets.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const envFile = path.join(repoRoot, '.env.production.local');
const vercelBin = path.join(
  repoRoot,
  'node_modules',
  'vercel',
  'dist',
  'index.js'
);

function runNode(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runVercel(args) {
  if (!fs.existsSync(vercelBin)) {
    console.error(
      'Vercel CLI not found. Run `npm install` in the repo root first.'
    );
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [vercelBin, ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('Checking Vercel login…');
const whoami = spawnSync(process.execPath, [vercelBin, 'whoami'], {
  cwd: repoRoot,
  encoding: 'utf8',
});
if (whoami.status !== 0) {
  console.error(`
Not logged in to Vercel.

Run once in your terminal (opens browser):

  npx vercel login

Or set a token from https://vercel.com/account/tokens :

  $env:VERCEL_TOKEN = "your-token"

Then link this repo to your deployment:

  npx vercel link

Re-run:

  npm run db:migrate:vercel
`);
  process.exit(1);
}
console.log(whoami.stdout.trim());

if (!fs.existsSync(path.join(repoRoot, '.vercel', 'project.json'))) {
  console.log(`
This folder is not linked to a Vercel project yet.

Run once (interactive):

  npx vercel link

Choose your team and the deployed web app project, then re-run:

  npm run db:migrate:vercel
`);
  process.exit(1);
}

console.log(`Pulling production env → ${path.basename(envFile)}\n`);
runVercel(['env', 'pull', envFile, '--environment=production', '--yes']);

if (!fs.existsSync(envFile)) {
  console.error('Env pull did not create the expected file.');
  process.exit(1);
}

console.log('\nApplying migrations to the linked production database…\n');
runNode([
  '--env-file',
  envFile,
  path.join(__dirname, 'migrate-production.js'),
]);

console.log(
  `\nFinished. ${path.basename(envFile)} is on disk (gitignored) — delete it if you do not need it locally.`
);
