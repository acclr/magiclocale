import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

export type ScannedSourceKey = {
  key: string;
  sourceText: string;
  file: string;
  line: number;
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

export function scanSourceTree(root: string): ScannedSourceKey[] {
  const found = new Map<string, ScannedSourceKey>();
  for (const file of walk(root)) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const pattern of TRANSLATE_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(line)) !== null) {
          const key = match[1].trim();
          const sourceText = match[2];
          if (!key || !sourceText.trim()) {
            continue;
          }
          const existing = found.get(key);
          const entry: ScannedSourceKey = {
            key,
            sourceText,
            file,
            line: index + 1,
          };
          if (!existing) {
            found.set(key, entry);
          }
        }
      }
    }
  }
  return [...found.values()].sort((left, right) =>
    left.key.localeCompare(right.key)
  );
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
