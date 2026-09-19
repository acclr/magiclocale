import { namespaceDepth, namespaceFromKey, rootNamespace } from '../keys/namespace';
import type { KeyMeta, SourceUsage } from '../keys/types';
import {
  DEFAULT_ARCHITECTURE_RULES,
  type ArchitectureFinding,
  type ArchitectureRuleConfig,
  type FindingKind,
} from './types';

export type AnalyzerInput = {
  keys: KeyMeta[];
  usagesByKeyId: Record<string, SourceUsage[]>;
  translationSourceText: Record<string, string>;
  definedFlagKeys: Set<string>;
  productionEnabledSince: Record<string, Date | null>;
  productionDisabledSince?: Record<string, Date | null>;
  rules: ArchitectureRuleConfig;
  now?: Date;
};

type DraftFinding = Omit<ArchitectureFinding, 'id' | 'createdAt' | 'status'>;

export function analyzeArchitecture(input: AnalyzerInput): DraftFinding[] {
  const rules = { ...DEFAULT_ARCHITECTURE_RULES, ...input.rules };
  const now = input.now ?? new Date();
  const findings: DraftFinding[] = [];
  const projectId = input.keys[0]?.projectId ?? '';

  const sourceGroups = new Map<string, KeyMeta[]>();

  for (const key of input.keys) {
    const usages = input.usagesByKeyId[key.id] ?? [];
    const typeRules = rules;

    if (
      key.lifecycle !== 'deprecated' &&
      key.lifecycle !== 'archived' &&
      key.usageCount === 0
    ) {
      findings.push(
        finding(
          projectId,
          key.id,
          'unused-key',
          `Unused ${label(key.type)}`,
          `${key.key} has no detected source usages.`,
          'Review whether this key can be archived or deleted.'
        )
      );
    }

    if (typeRules.requiredOwner && !key.owner) {
      findings.push(
        finding(
          projectId,
          key.id,
          'missing-owner',
          'Missing owner',
          `${key.key} has no owner.`,
          'Assign a team or person as owner.'
        )
      );
    }

    if (typeRules.requiredDescription && !key.description) {
      findings.push(
        finding(
          projectId,
          key.id,
          'missing-description',
          'Missing description',
          `${key.key} has no description.`,
          'Add a short description of what this key controls.'
        )
      );
    }

    const depth = namespaceDepth(key.namespace ?? namespaceFromKey(key.key));
    if (typeRules.maxDepth !== undefined && depth > typeRules.maxDepth) {
      findings.push(
        naming(
          projectId,
          key,
          `Namespace depth ${depth} exceeds the maximum of ${typeRules.maxDepth}.`
        )
      );
    }
    if (
      typeRules.minDepth !== undefined &&
      depth < typeRules.minDepth &&
      key.type === 'feature-flag'
    ) {
      findings.push(
        naming(
          projectId,
          key,
          `Feature flags should start with a domain namespace.`
        )
      );
    }

    const root = rootNamespace(key.key)?.toLowerCase();
    if (
      typeRules.allowedRootNamespaces?.length &&
      root &&
      !typeRules.allowedRootNamespaces.includes(root)
    ) {
      findings.push(
        finding(
          projectId,
          key.id,
          'namespace-inconsistency',
          'Unexpected root namespace',
          `${key.key} starts with "${root}", which is not in the allowed domain list.`,
          `Use one of: ${typeRules.allowedRootNamespaces.join(', ')}.`
        )
      );
    }

    const prefix = (typeRules.forbiddenPrefixes ?? []).find((item) =>
      key.key.toLowerCase().startsWith(`${item}`)
    );
    if (prefix && !key.key.includes('.')) {
      findings.push(
        naming(
          projectId,
          key,
          `"${key.key}" uses a forbidden prefix. Prefer <domain>.<feature>.<purpose>.`
        )
      );
    }

    if (
      key.type === 'feature-flag' &&
      !input.definedFlagKeys.has(key.key)
    ) {
      findings.push(
        finding(
          projectId,
          key.id,
          'unknown-flag',
          'Unknown feature flag',
          `${key.key} is used in source but has no Keykit definition.`,
          'Create the flag or remove the source usage.'
        )
      );
    }

    if (
      key.type === 'feature-flag' &&
      key.reviewAt &&
      key.reviewAt < now
    ) {
      findings.push(
        finding(
          projectId,
          key.id,
          'temporary-flag-overdue',
          'Temporary flag overdue for review',
          `${key.key} was due for review on ${key.reviewAt.toISOString().slice(0, 10)}.`,
          'Review whether this flag can be removed.'
        )
      );
    }

    const enabledSince = input.productionEnabledSince[key.key];
    const disabledSince = input.productionDisabledSince?.[key.key];
    const staleDays = typeRules.staleEnabledDays ?? 90;
    if (
      key.type === 'feature-flag' &&
      enabledSince &&
      daysBetween(enabledSince, now) >= staleDays
    ) {
      findings.push(
        finding(
          projectId,
          key.id,
          'stale-flag',
          'Potentially stale feature flag',
          `${key.key} has been ON in production for ${daysBetween(
            enabledSince,
            now
          )} days.`,
          'Consider removing the flag and leftover fallback code.'
        )
      );
    } else if (
      key.type === 'feature-flag' &&
      disabledSince &&
      key.usageCount > 0 &&
      daysBetween(disabledSince, now) >= staleDays
    ) {
      findings.push(
        finding(
          projectId,
          key.id,
          'stale-flag',
          'Potentially stale feature flag',
          `${key.key} has been OFF in production for ${daysBetween(
            disabledSince,
            now
          )} days.`,
          'Remove leftover checks, or turn the flag on if the feature is still needed.'
        )
      );
    }

    if (key.type === 'translation') {
      const source = input.translationSourceText[key.key]?.trim().toLowerCase();
      if (source) {
        const group = sourceGroups.get(source) ?? [];
        group.push(key);
        sourceGroups.set(source, group);
      }
    }

    void usages;
  }

  for (const entry of Array.from(sourceGroups.entries())) {
    const source = entry[0];
    const group = entry[1];
    if (group.length < 2) {
      continue;
    }
    findings.push(
      finding(
        projectId,
        group[0].id,
        'duplicate-translation',
        'Potential shared translation',
        `${group.map((item) => item.key).join(', ')} all contain "${source}".`,
        'Consider consolidating under a common.* key.'
      )
    );
  }

  const flags = input.keys.filter((key) => key.type === 'feature-flag');
  const byRoot = new Map<string, KeyMeta[]>();
  for (const flag of flags) {
    const inferred =
      inferFeatureFromUsages(input.usagesByKeyId[flag.id] ?? []) ??
      rootNamespace(flag.key);
    if (!inferred) {
      continue;
    }
    const group = byRoot.get(inferred) ?? [];
    group.push(flag);
    byRoot.set(inferred, group);
  }
  for (const entry of Array.from(byRoot.entries())) {
    const feature = entry[0];
    const group = entry[1];
    if (group.length < 2) {
      continue;
    }
    const distinct = new Set(group.map((item) => item.key));
    if (distinct.size < 2) {
      continue;
    }
    findings.push(
      finding(
        projectId,
        group[0].id,
        'overlapping-flags',
        'Potential overlapping feature flags',
        `${Array.from(distinct).join(', ')} appear related to ${feature}.`,
        'Review usages, compare environments, merge, or mark intentional.'
      )
    );
  }

  return findings;
}

function naming(
  projectId: string,
  key: KeyMeta,
  message: string
): DraftFinding {
  return finding(
    projectId,
    key.id,
    'naming-issue',
    'Naming does not match project convention',
    `${key.key}: ${message}`,
    namespaceFromKey(key.key)
      ? null
      : `Suggested: <domain>.<feature>.${key.key}`
  );
}

function finding(
  projectId: string,
  keyMetaId: string | null,
  kind: FindingKind,
  title: string,
  message: string,
  suggestion: string | null
): DraftFinding {
  return { projectId, keyMetaId, kind, title, message, suggestion };
}

function label(type: KeyMeta['type']): string {
  return type === 'feature-flag' ? 'feature flag' : 'translation';
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

function inferFeatureFromUsages(usages: SourceUsage[]): string | null {
  for (const usage of usages) {
    const match = usage.file.match(/features\/([^/]+)/);
    if (match) {
      return match[1];
    }
  }
  return null;
}
