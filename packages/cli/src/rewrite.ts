import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

export type RewriteOperation = {
  type: string;
  fromKey: string;
  toKey?: string | null;
  sourceText?: string | null;
};

export type RewritePlan = {
  operations: RewriteOperation[];
};

export type RewriteResult = {
  filesChanged: number;
  rewrittenFiles: string[];
  appliedOperations: Array<{ fromKey: string; toKey: string }>;
};

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

const SUPPORTED_REWRITE_TYPES = new Set([
  'rename-key',
  'move-key',
  'merge-translations',
]);

export function rewriteSourceTreeDetailed(
  root: string,
  plan: RewritePlan
): RewriteResult {
  const renames = plan.operations.filter(
    (operation): operation is RewriteOperation & { toKey: string } =>
      SUPPORTED_REWRITE_TYPES.has(operation.type) &&
      Boolean(operation.fromKey?.trim()) &&
      typeof operation.toKey === 'string' &&
      Boolean(operation.toKey.trim()) &&
      operation.fromKey.trim() !== operation.toKey.trim()
  );
  if (!renames.length) {
    return {
      filesChanged: 0,
      rewrittenFiles: [],
      appliedOperations: [],
    };
  }

  let filesChanged = 0;
  const rewrittenFiles: string[] = [];
  const appliedSet = new Map<string, { fromKey: string; toKey: string }>();

  for (const file of walk(root)) {
    const original = readFileSync(file, 'utf8');
    let next = original;
    for (const operation of renames) {
      const beforeOp = next;
      next = next.split(`"${operation.fromKey}"`).join(`"${operation.toKey}"`);
      next = next.split(`'${operation.fromKey}'`).join(`'${operation.toKey}'`);
      next = next
        .split(`\`${operation.fromKey}\``)
        .join(`\`${operation.toKey}\``);
      if (next !== beforeOp) {
        appliedSet.set(`${operation.fromKey}->${operation.toKey}`, {
          fromKey: operation.fromKey,
          toKey: operation.toKey,
        });
      }
    }
    if (next !== original) {
      writeFileSync(file, next);
      filesChanged += 1;
      const rel = relative(root, file).split(sep).join('/');
      rewrittenFiles.push(rel || file);
    }
  }

  return {
    filesChanged,
    rewrittenFiles,
    appliedOperations: Array.from(appliedSet.values()),
  };
}

export function rewriteSourceTree(root: string, plan: RewritePlan): number {
  return rewriteSourceTreeDetailed(root, plan).filesChanged;
}

function walk(directory: string): string[] {
  const skip = new Set([
    'node_modules',
    '.git',
    'dist',
    '.next',
    '.keykit',
    'coverage',
    '.turbo',
    'build',
    'out',
  ]);
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (skip.has(entry)) {
      continue;
    }
    const full = join(directory, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (SOURCE_EXTENSIONS.has(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}
