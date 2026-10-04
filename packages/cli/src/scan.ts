import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export type ScannedSourceKey = {
  key: string;
  sourceText: string;
  file: string;
  line: number;
};

export type ScanOptions = {
  /** Paths relative to `root`. Omit to scan the whole tree. */
  include?: readonly string[];
  /** Extra directory names or relative paths to skip. */
  exclude?: readonly string[];
};

export type ScanResult = {
  keys: ScannedSourceKey[];
  fileCount: number;
};

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

const TRANSLATE_PATTERNS = [
  /\btranslate\s*\(\s*[`'"]([^`'"]+)[`'"]\s*,\s*[`'"]([^`'"]*)[`'"]/g,
  /\bt\s*\(\s*[`'"]([^`'"]+)[`'"]\s*,\s*[`'"]([^`'"]*)[`'"]/g,
];

/** Always skipped, including when a parent directory is included. */
export const DEFAULT_SKIP_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  '.next',
  'coverage',
  'out',
  'build',
  '.keykit',
  'vendor',
];

export function scanSourceTree(
  root: string,
  options: ScanOptions = {}
): ScannedSourceKey[] {
  return scanProject(root, options).keys;
}

export function scanProject(root: string, options: ScanOptions = {}): ScanResult {
  const projectRoot = resolve(root);
  const exclude = excludeRules(options.exclude);
  const found = new Map<string, ScannedSourceKey>();
  let fileCount = 0;

  for (const target of scanTargets(projectRoot, options.include)) {
    for (const file of walk(target, projectRoot, exclude)) {
      fileCount += 1;
      collectKeys(file, found);
    }
  }

  return {
    fileCount,
    keys: Array.from(found.values()).sort((left, right) =>
      left.key.localeCompare(right.key)
    ),
  };
}

function collectKeys(file: string, found: Map<string, ScannedSourceKey>): void {
  const content = readFileSync(file, 'utf8');
  for (const pattern of TRANSLATE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1].trim();
      const sourceText = match[2];
      if (!key || !sourceText.trim()) {
        continue;
      }
      if (!found.has(key)) {
        found.set(key, {
          key,
          sourceText,
          file,
          line: lineNumberAt(content, match.index),
        });
      }
    }
  }
}

/** 1-based line of `index`, counting `\n` so CRLF files stay aligned. */
function lineNumberAt(content: string, index: number): number {
  let line = 1;
  const end = Math.min(index, content.length);
  for (let cursor = 0; cursor < end; cursor += 1) {
    if (content.charCodeAt(cursor) === 10) {
      line += 1;
    }
  }
  return line;
}

function scanTargets(root: string, include: readonly string[] | undefined): string[] {
  if (!include?.length) {
    return [root];
  }

  return include.map((entry) => {
    const full = resolve(root, entry);
    const fromRoot = relative(root, full);
    if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
      throw new Error(`Scan path must stay inside the project: ${entry}`);
    }
    if (!existsSync(full)) {
      throw new Error(`Scan path does not exist: ${entry}`);
    }
    return full;
  });
}

type ExcludeRules = {
  names: Set<string>;
  prefixes: string[];
};

function excludeRules(extra: readonly string[] | undefined): ExcludeRules {
  const names = new Set(DEFAULT_SKIP_DIRECTORIES);
  const prefixes: string[] = [];
  for (const entry of extra ?? []) {
    const normalized = entry.trim().replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/\/+$/, '');
    if (!normalized || normalized === '.') {
      continue;
    }
    if (normalized.includes('/')) {
      prefixes.push(normalized);
    } else {
      names.add(normalized);
    }
  }
  return { names, prefixes };
}

function walk(directory: string, root: string, exclude: ExcludeRules): string[] {
  if (!statSync(directory).isDirectory()) {
    return shouldSkip(directory, root, exclude) ||
      !SOURCE_EXTENSIONS.has(extname(directory))
      ? []
      : [directory];
  }

  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (shouldSkip(full, root, exclude)) {
      continue;
    }
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full, root, exclude));
    } else if (SOURCE_EXTENSIONS.has(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

function shouldSkip(full: string, root: string, exclude: ExcludeRules): boolean {
  const rel = relative(root, full).split(sep).join('/');
  if (!rel || rel === '.') {
    return false;
  }
  const segments = rel.split('/');
  if (segments.some((segment) => exclude.names.has(segment))) {
    return true;
  }
  return exclude.prefixes.some(
    (prefix) => rel === prefix || rel.startsWith(`${prefix}/`)
  );
}
