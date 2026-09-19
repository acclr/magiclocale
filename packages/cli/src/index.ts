#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { rewriteSourceTree, type RewritePlan } from './rewrite';

function flatten(value: unknown, prefix = '', out: Array<{ key: string; sourceText: string }> = []) {
  if (typeof value === 'string') {
    if (prefix) {
      out.push({ key: prefix, sourceText: value });
    }
    return out;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return out;
  }
  for (const [name, nested] of Object.entries(value)) {
    flatten(nested, prefix ? `${prefix}.${name}` : name, out);
  }
  return out;
}

function main() {
  const [, , command, ...args] = process.argv;
  if (command === 'rewrite') {
    const file = argValue(args, '--file');
    const root = argValue(args, '--root') ?? process.cwd();
    if (!file) {
      throw new Error('Usage: keykit rewrite --file migration.json --root .');
    }
    const plan = JSON.parse(readFileSync(resolve(file), 'utf8')) as RewritePlan;
    const changed = rewriteSourceTree(resolve(root), plan);
    console.log(
      `Rewrote ${changed} file(s). Upload completion in the Keykit migrations UI.`
    );
    return;
  }

  if (command === 'flatten-json') {
    const file = argValue(args, '--file');
    if (!file) {
      throw new Error('Usage: keykit flatten-json --file messages.json');
    }
    const parsed = JSON.parse(readFileSync(resolve(file), 'utf8')) as unknown;
    console.log(JSON.stringify(flatten(parsed), null, 2));
    return;
  }

  console.log(`Keykit CLI
  rewrite --file migration.json --root .
  flatten-json --file messages.json

The backend never writes customer filesystems. Apply Keykit migrations
locally, then commit the result.`);
}

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

main();
