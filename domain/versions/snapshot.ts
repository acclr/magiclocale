import type { FlagSetSnapshot, FlagSnapshot } from '../flags/types';
import { isHumanOwned } from '../translations/invariants';
import type {
  Project,
  Translation,
  TranslationKey,
} from '../translations/types';
import type {
  CellMetadata,
  DiffEntry,
  LocaleBundleSnapshot,
  PromotionEntry,
  PromotionPlan,
  VersionDiff,
} from './types';

const CELL_SEPARATOR = '\u0000';

export function cellId(locale: string, key: string): string {
  return `${locale}${CELL_SEPARATOR}${key}`;
}

const SOURCE_TEXT_METADATA: CellMetadata = {
  source: 'code',
  status: 'source',
  aiLocked: false,
};

/**
 * Freeze one environment's working copy into per-locale snapshots.
 *
 * A missing cell falls back to the key's source text only for the source
 * locale, which is the same rule the live bundle builder used before
 * publishing existed. Target locales stay absent so the SDK can fall back to
 * its own default text.
 */
export function buildLocaleBundles(
  project: Project,
  keys: TranslationKey[],
  translations: Translation[]
): LocaleBundleSnapshot[] {
  const byCell = new Map<string, Translation>();
  for (const translation of translations) {
    byCell.set(
      cellId(translation.locale, translation.translationKeyId),
      translation
    );
  }

  return project.locales.map((locale) => {
    const values: Record<string, string> = {};
    const metadata: Record<string, CellMetadata> = {};

    for (const key of keys) {
      const translation = byCell.get(cellId(locale, key.id));
      if (translation) {
        values[key.key] = translation.value;
        metadata[key.key] = {
          source: translation.source,
          status: translation.status,
          aiLocked: translation.aiLocked,
        };
        continue;
      }
      if (locale === project.sourceLocale) {
        values[key.key] = key.sourceText;
        metadata[key.key] = SOURCE_TEXT_METADATA;
      }
    }

    return {
      locale,
      translations: values,
      metadata,
      keyCount: Object.keys(values).length,
    };
  });
}

function bundlesByLocale(
  bundles: LocaleBundleSnapshot[]
): Map<string, LocaleBundleSnapshot> {
  return new Map(bundles.map((bundle) => [bundle.locale, bundle]));
}

function flagsByKey(flags: FlagSnapshot[]): Map<string, FlagSnapshot> {
  return new Map(flags.map((flag) => [flag.key, flag]));
}

function sameFlag(left: FlagSnapshot, right: FlagSnapshot): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * What publishing this environment would change, computed by comparing the
 * working copy against the live snapshot rather than by replaying change
 * records. Derived state cannot drift, so this is what the publish bar and
 * the diff view both read.
 */
export function diffSnapshots(
  live: { locales: LocaleBundleSnapshot[]; flags: FlagSetSnapshot } | null,
  working: { locales: LocaleBundleSnapshot[]; flags: FlagSetSnapshot }
): VersionDiff {
  const entries: DiffEntry[] = [];
  const liveLocales = bundlesByLocale(live?.locales ?? []);
  const workingLocales = bundlesByLocale(working.locales);
  const allLocales = new Set(
    Array.from(liveLocales.keys()).concat(Array.from(workingLocales.keys()))
  );

  for (const locale of Array.from(allLocales).sort()) {
    const before = liveLocales.get(locale)?.translations ?? {};
    const after = workingLocales.get(locale)?.translations ?? {};
    const keys = new Set(Object.keys(before).concat(Object.keys(after)));

    for (const key of Array.from(keys).sort()) {
      const beforeValue = before[key] ?? null;
      const afterValue = after[key] ?? null;
      if (beforeValue === afterValue) {
        continue;
      }

      entries.push({
        entityType: 'translation',
        kind:
          beforeValue === null
            ? 'added'
            : afterValue === null
              ? 'removed'
              : 'changed',
        key,
        locale,
        before: beforeValue,
        after: afterValue,
      });
    }
  }

  const liveFlags = flagsByKey(live?.flags.flags ?? []);
  const workingFlags = flagsByKey(working.flags.flags);
  const flagKeys = new Set(
    Array.from(liveFlags.keys()).concat(Array.from(workingFlags.keys()))
  );

  for (const key of Array.from(flagKeys).sort()) {
    const before = liveFlags.get(key) ?? null;
    const after = workingFlags.get(key) ?? null;
    if (before && after && sameFlag(before, after)) {
      continue;
    }

    entries.push({
      entityType: 'flag',
      kind: !before ? 'added' : !after ? 'removed' : 'changed',
      key,
      before,
      after,
    });
  }

  const translationCount = entries.filter(
    (entry) => entry.entityType === 'translation'
  ).length;

  return {
    entries,
    translationCount,
    flagCount: entries.length - translationCount,
    total: entries.length,
  };
}

export type PromotionTargetCell = Pick<
  Translation,
  'value' | 'source' | 'status' | 'aiLocked'
>;

/**
 * Decide, cell by cell, what promoting a sealed snapshot into another
 * environment would do.
 *
 * The human-ownership invariant applies: an AI- or code-written incoming
 * value never replaces a human-owned target cell. Only a value a human
 * authored in the source environment may overwrite one, and even then the
 * operator confirms the plan first.
 */
export function planPromotion(input: {
  sourceEnvironmentId: string;
  targetEnvironmentId: string;
  sourceVersionId: string;
  sourceVersionNumber: number;
  incoming: LocaleBundleSnapshot[];
  currentCells: Map<string, PromotionTargetCell>;
  targetLocales: string[];
  flagCount: number;
}): PromotionPlan {
  const allowedLocales = new Set(input.targetLocales);
  const entries: PromotionEntry[] = [];

  for (const bundle of input.incoming) {
    if (!allowedLocales.has(bundle.locale)) {
      continue;
    }

    for (const key of Object.keys(bundle.translations).sort()) {
      const incoming = bundle.translations[key];
      const incomingSource = bundle.metadata?.[key]?.source ?? 'ai';
      const current = input.currentCells.get(cellId(bundle.locale, key));

      if (current && current.value === incoming) {
        entries.push({
          key,
          locale: bundle.locale,
          action: 'unchanged',
          incoming,
          incomingSource,
          current: current.value,
        });
        continue;
      }

      if (current && isHumanOwned(current) && incomingSource !== 'manual') {
        entries.push({
          key,
          locale: bundle.locale,
          action: 'skip-conflict',
          incoming,
          incomingSource,
          current: current.value,
          conflictReason: 'human-owned-target',
        });
        continue;
      }

      entries.push({
        key,
        locale: bundle.locale,
        action: 'apply',
        incoming,
        incomingSource,
        current: current?.value ?? null,
      });
    }
  }

  const count = (action: PromotionEntry['action']) =>
    entries.filter((entry) => entry.action === action).length;

  return {
    sourceEnvironmentId: input.sourceEnvironmentId,
    targetEnvironmentId: input.targetEnvironmentId,
    sourceVersionId: input.sourceVersionId,
    sourceVersionNumber: input.sourceVersionNumber,
    entries,
    applyCount: count('apply'),
    conflictCount: count('skip-conflict'),
    unchangedCount: count('unchanged'),
    flagCount: input.flagCount,
  };
}
