import type { KeyMeta, SourceUsage } from '../keys/types';
import type { IncomingSourceKey, TranslationKey } from './types';

export type RenameCandidate = {
  id: string;
  key: string;
  sourceText: string;
  lifecycle?: KeyMeta['lifecycle'];
  replacementKey?: string | null;
  usages?: ReadonlyArray<Pick<SourceUsage, 'file' | 'line'>>;
};

export type DetectedKeyRename = {
  fromKeyId: string;
  fromKey: string;
  toKey: string;
  item: IncomingSourceKey;
  sourceTextChanged: boolean;
};

export type DetectKeyRenamesInput = {
  missingIncoming: readonly IncomingSourceKey[];
  allIncomingKeyNames: readonly string[];
  removedKeys?: readonly string[];
  existingKeys: readonly TranslationKey[];
  catalogMeta?: readonly KeyMeta[];
  usages?: readonly SourceUsage[];
};

/**
 * Splits a translation key into lowercase words across dots, dashes,
 * underscores, slashes, and camelCase boundaries.
 * Example: "invitations.acceptInvite" -> ["invitations", "accept", "invite"]
 */
export function tokenizeKeyName(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Measures how strongly two key names share tokens (0 to 1).
 * When all tokens of `fromKey` appear in `toKey` (e.g. "accept-invite" ->
 * "invitations.acceptInvite"), returns a high similarity score.
 */
export function keyTokenSimilarity(fromKey: string, toKey: string): number {
  const fromTokens = tokenizeKeyName(fromKey);
  const toTokens = tokenizeKeyName(toKey);
  if (fromTokens.length === 0 || toTokens.length === 0) {
    return 0;
  }

  const fromSet = new Set(fromTokens);
  const toSet = new Set(toTokens);
  let shared = 0;
  for (const token of Array.from(fromSet)) {
    if (toSet.has(token)) {
      shared += 1;
    }
  }
  if (shared === 0) {
    return 0;
  }

  const containment = shared / Math.min(fromSet.size, toSet.size);
  const union = new Set(fromTokens.concat(toTokens)).size;
  const jaccard = shared / union;
  return containment * 0.7 + jaccard * 0.3;
}

function normalizePath(file: string): string {
  return file.trim().replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Matches incoming keys that do not yet exist in `TranslationKey` against
 * existing project keys that were renamed in source code.
 *
 * A project key is only eligible as a rename source when it is NOT present
 * in the incoming batch and at least one signal shows it was replaced rather
 * than co-existing as a duplicate key:
 * 1. It is explicitly listed in `removedKeys` from the CLI scan,
 * 2. Its catalog lifecycle is already `'deprecated'`, or
 * 3. It was previously detected in the exact same source file as the new key.
 */
export function detectKeyRenames(
  input: DetectKeyRenamesInput
): DetectedKeyRename[] {
  if (
    input.missingIncoming.length === 0 ||
    input.existingKeys.length === 0
  ) {
    return [];
  }

  const incomingSet = new Set(input.allIncomingKeyNames);
  const removedSet = new Set(input.removedKeys ?? []);
  const catalogByKey = new Map(
    (input.catalogMeta ?? []).map((meta) => [meta.key, meta])
  );
  const catalogById = new Map(
    (input.catalogMeta ?? []).map((meta) => [meta.id, meta])
  );
  const usagesByKey = new Map<
    string,
    Array<Pick<SourceUsage, 'file' | 'line'>>
  >();
  for (const usage of input.usages ?? []) {
    const meta = catalogById.get(usage.keyMetaId);
    if (!meta) {
      continue;
    }
    const list = usagesByKey.get(meta.key) ?? [];
    list.push({ file: usage.file, line: usage.line });
    usagesByKey.set(meta.key, list);
  }

  const candidates: RenameCandidate[] = [];
  for (const existing of input.existingKeys) {
    if (incomingSet.has(existing.key)) {
      continue;
    }
    const meta = catalogByKey.get(existing.key);
    if (meta?.lifecycle === 'archived') {
      continue;
    }
    if (meta?.replacementKey) {
      continue;
    }
    candidates.push({
      id: existing.id,
      key: existing.key,
      sourceText: existing.sourceText,
      lifecycle: meta?.lifecycle,
      replacementKey: meta?.replacementKey ?? null,
      usages: usagesByKey.get(existing.key) ?? [],
    });
  }

  if (candidates.length === 0) {
    return [];
  }

  type ScoredPair = {
    missingIndex: number;
    candidate: RenameCandidate;
    score: number;
    sourceTextChanged: boolean;
  };

  const pairs: ScoredPair[] = [];

  for (let index = 0; index < input.missingIncoming.length; index += 1) {
    const item = input.missingIncoming[index];
    const itemFile = item.usage?.file ? normalizePath(item.usage.file) : null;
    const itemLine = item.usage?.line ?? null;
    const itemText = normalizeText(item.sourceText);

    for (const candidate of candidates) {
      if (candidate.key === item.key) {
        continue;
      }

      const inRemoved = removedSet.has(candidate.key);
      const isDeprecated = candidate.lifecycle === 'deprecated';
      const usages = candidate.usages ?? [];
      const sameFileUsages = itemFile
        ? usages.filter((usage) => normalizePath(usage.file) === itemFile)
        : [];
      const hasSameFile = sameFileUsages.length > 0;
      const hasSameLine =
        hasSameFile &&
        itemLine !== null &&
        sameFileUsages.some((usage) => usage.line === itemLine);
      const hasNearbyLine =
        hasSameFile &&
        itemLine !== null &&
        sameFileUsages.some((usage) => Math.abs(usage.line - itemLine) <= 10);

      // Must have evidence that the old key disappeared or was replaced at the usage site.
      if (!inRemoved && !isDeprecated && !hasSameFile) {
        continue;
      }

      const exactSourceMatch = candidate.sourceText === item.sourceText;
      const normalizedSourceMatch =
        exactSourceMatch || normalizeText(candidate.sourceText) === itemText;
      const tokenSimilarity = keyTokenSimilarity(candidate.key, item.key);

      if (normalizedSourceMatch) {
        let score = exactSourceMatch ? 100 : 90;
        if (inRemoved) {
          score += 50;
        }
        if (isDeprecated) {
          score += 30;
        }
        if (hasSameLine) {
          score += 80;
        } else if (hasNearbyLine) {
          score += 60;
        } else if (hasSameFile) {
          score += 40;
        }
        score += Math.round(tokenSimilarity * 40);

        pairs.push({
          missingIndex: index,
          candidate,
          score,
          sourceTextChanged: !exactSourceMatch,
        });
        continue;
      }

      // Secondary match: key was renamed AND source text was edited at the same time.
      // Requires either exact file:line match or strong token overlap on an explicitly removed key.
      if (inRemoved && hasSameLine && tokenSimilarity > 0) {
        pairs.push({
          missingIndex: index,
          candidate,
          score: 85 + Math.round(tokenSimilarity * 40),
          sourceTextChanged: true,
        });
      } else if (
        inRemoved &&
        tokenSimilarity >= 0.65 &&
        input.missingIncoming.length === 1 &&
        removedSet.size === 1
      ) {
        pairs.push({
          missingIndex: index,
          candidate,
          score: 75 + Math.round(tokenSimilarity * 40),
          sourceTextChanged: true,
        });
      }
    }
  }

  pairs.sort((left, right) => right.score - left.score);

  const matchedMissing = new Set<number>();
  const matchedCandidates = new Set<string>();
  const renamed: DetectedKeyRename[] = [];

  for (const pair of pairs) {
    if (
      matchedMissing.has(pair.missingIndex) ||
      matchedCandidates.has(pair.candidate.id)
    ) {
      continue;
    }
    matchedMissing.add(pair.missingIndex);
    matchedCandidates.add(pair.candidate.id);
    renamed.push({
      fromKeyId: pair.candidate.id,
      fromKey: pair.candidate.key,
      toKey: input.missingIncoming[pair.missingIndex].key,
      item: input.missingIncoming[pair.missingIndex],
      sourceTextChanged: pair.sourceTextChanged,
    });
  }

  return renamed;
}
