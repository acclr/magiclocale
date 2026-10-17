import type { DashboardRow } from './dashboard-projector';
import { isHumanOwned } from './invariants';
import type { Translation } from './types';

export type DuplicateKeyGroupItem = {
  keyId: string;
  key: string;
  sourceText: string;
  namespace: string | null;
  usageCount: number;
  usageFiles: string[];
  lifecycle: string;
};

export type DuplicateKeyGroup = {
  id: string;
  normalizedText: string;
  sourceText: string;
  suggestedKey: string;
  keys: DuplicateKeyGroupItem[];
};

export type KeyReplacementRule = {
  fromKey: string;
  toKey: string;
  sourceText?: string;
};

export type MergeKeysResult = {
  targetKey: string;
  targetKeyId: string;
  sourceText: string;
  mergedKeys: string[];
  migrationId?: string;
};

function normalizeDuplicateText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function leafSegment(key: string): string {
  const trimmed = key.trim();
  const parts = trimmed.split('.').filter(Boolean);
  return parts[parts.length - 1] ?? trimmed;
}

/**
 * Suggests a consolidated key name for a set of duplicate keys.
 * Example: ["feature1.ok", "feature2.ok"] -> "common.ok"
 */
export function suggestMergedKeyName(keys: readonly string[]): string {
  const cleaned = keys.map((key) => key.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return 'common.value';
  }

  const existingCommon = cleaned.find((key) => key.startsWith('common.'));
  if (existingCommon) {
    return existingCommon;
  }

  const leaves = cleaned.map(leafSegment).filter(Boolean);
  const firstLeaf = leaves[0] ?? 'value';
  return `common.${firstLeaf}`;
}

/**
 * Groups active rows that share identical normalized source text (or identical
 * translated values across target locales) so administrators can spot and
 * merge duplicate keys in one click.
 */
export function findDuplicateKeyGroups(
  rows: readonly DashboardRow[]
): DuplicateKeyGroup[] {
  const byNormalizedSource = new Map<string, DashboardRow[]>();

  for (const row of rows) {
    if (row.lifecycle === 'deprecated' || row.lifecycle === 'archived') {
      continue;
    }
    const normalized = normalizeDuplicateText(row.sourceText);
    if (!normalized) {
      continue;
    }
    const group = byNormalizedSource.get(normalized) ?? [];
    group.push(row);
    byNormalizedSource.set(normalized, group);
  }

  const groups: DuplicateKeyGroup[] = [];
  for (const [normalizedText, groupRows] of Array.from(
    byNormalizedSource.entries()
  )) {
    if (groupRows.length < 2) {
      continue;
    }
    const sorted = [...groupRows].sort((left, right) =>
      left.key.localeCompare(right.key)
    );
    const keyNames = sorted.map((row) => row.key);
    groups.push({
      id: `dup:${normalizedText}`,
      normalizedText,
      sourceText: sorted[0].sourceText,
      suggestedKey: suggestMergedKeyName(keyNames),
      keys: sorted.map((row) => ({
        keyId: row.keyId,
        key: row.key,
        sourceText: row.sourceText,
        namespace: row.namespace,
        usageCount: row.usageCount,
        usageFiles: row.usageFiles,
        lifecycle: row.lifecycle,
      })),
    });
  }

  return groups.sort((left, right) => {
    if (right.keys.length !== left.keys.length) {
      return right.keys.length - left.keys.length;
    }
    return left.suggestedKey.localeCompare(right.suggestedKey);
  });
}

/**
 * Returns the set of `keyId`s that belong to any duplicate group.
 */
export function findDuplicateKeyIds(
  rows: readonly DashboardRow[]
): Set<string> {
  const groups = findDuplicateKeyGroups(rows);
  const ids = new Set<string>();
  for (const group of groups) {
    for (const item of group.keys) {
      ids.add(item.keyId);
    }
  }
  return ids;
}

/**
 * Selects the best translation cell among merged keys for one locale.
 * Human-edited / locked cells always take precedence over AI or code cells.
 */
export function pickMergedTranslation(
  candidates: readonly Translation[],
  preferredKeyId?: string
): Translation | null {
  if (candidates.length === 0) {
    return null;
  }

  const score = (cell: Translation): number => {
    let value = 0;
    if (isHumanOwned(cell) && cell.status === 'manual') {
      value += 100;
    } else if (isHumanOwned(cell)) {
      value += 80;
    } else if (cell.source === 'ai') {
      value += 40;
    } else {
      value += 20;
    }
    if (preferredKeyId && cell.translationKeyId === preferredKeyId) {
      value += 10;
    }
    return value;
  };

  const sorted = [...candidates].sort((left, right) => score(right) - score(left));
  return sorted[0] ?? null;
}

/**
 * Flattens chained replacements (e.g. a -> b, b -> c becomes a -> c, b -> c)
 * and guards against circular replacement references.
 */
export function resolveTransitiveReplacements(
  rules: readonly KeyReplacementRule[]
): KeyReplacementRule[] {
  const byFrom = new Map<string, KeyReplacementRule>();
  for (const rule of rules) {
    const fromKey = rule.fromKey.trim();
    const toKey = rule.toKey.trim();
    if (!fromKey || !toKey || fromKey === toKey) {
      continue;
    }
    byFrom.set(fromKey, {
      fromKey,
      toKey,
      sourceText: rule.sourceText,
    });
  }

  const resolved: KeyReplacementRule[] = [];
  for (const rule of Array.from(byFrom.values())) {
    let target = rule.toKey;
    let sourceText = rule.sourceText;
    const visited = new Set<string>([rule.fromKey]);
    while (byFrom.has(target) && !visited.has(target)) {
      visited.add(target);
      const next = byFrom.get(target)!;
      target = next.toKey;
      if (next.sourceText !== undefined) {
        sourceText = next.sourceText;
      }
    }
    if (target !== rule.fromKey) {
      resolved.push({
        fromKey: rule.fromKey,
        toKey: target,
        ...(sourceText !== undefined ? { sourceText } : {}),
      });
    }
  }

  return resolved.sort((left, right) =>
    left.fromKey.localeCompare(right.fromKey)
  );
}
