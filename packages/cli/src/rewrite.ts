import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

export type RewriteOperation = {
  type: string;
  fromKey: string;
  toKey?: string | null;
};

export type RewritePlan = {
  operations: RewriteOperation[];
};

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

export function rewriteSourceTree(root: string, plan: RewritePlan): number {
  const renames = plan.operations.filter(
    (operation) =>
      (operation.type === 'rename-key' || operation.type === 'move-key') &&
      operation.toKey
  );
  if (!renames.length) {
    return 0;
  }

  let filesChanged = 0;
  for (const file of walk(root)) {
    const original = readFileSync(file, 'utf8');
    let next = original;
    for (const operation of renames) {
      next = next.split(`"${operation.fromKey}"`).join(`"${operation.toKey}"`);
      next = next.split(`'${operation.fromKey}'`).join(`'${operation.toKey}'`);
    }
    if (next !== original) {
      writeFileSync(file, next);
      filesChanged += 1;
    }
  }
  return filesChanged;
}

function walk(directory: string): string[] {
  const skip = new Set(['node_modules', '.git', 'dist', '.next']);
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
