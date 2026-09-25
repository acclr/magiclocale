import type { KeyType } from '../keys/types';

export type FindingKind =
  | 'unused-key'
  | 'stale-flag'
  | 'duplicate-translation'
  | 'overlapping-flags'
  | 'namespace-inconsistency'
  | 'missing-owner'
  | 'missing-description'
  | 'naming-issue'
  | 'unknown-flag'
  | 'temporary-flag-overdue';

export type FindingStatus = 'open' | 'reviewed' | 'ignored' | 'intentional';

export type ArchitectureRuleConfig = {
  allowedRootNamespaces?: string[];
  maxDepth?: number;
  minDepth?: number;
  requiredOwner?: boolean;
  requiredDescription?: boolean;
  forbiddenPrefixes?: string[];
  temporaryFlagReviewRequired?: boolean;
  staleEnabledDays?: number;
};

export type ArchitectureRule = {
  id: string;
  projectId: string;
  keyType: KeyType | null;
  config: ArchitectureRuleConfig;
};

export type ArchitectureFinding = {
  id: string;
  projectId: string;
  keyMetaId: string | null;
  kind: FindingKind;
  status: FindingStatus;
  title: string;
  message: string;
  suggestion: string | null;
  createdAt: Date;
};

export type ArchitectureHealth = {
  totalKeys: number;
  translations: number;
  featureFlags: number;
  findings: Record<FindingKind, number>;
};

export type ArchitectureNode = {
  namespace: string;
  translations: Array<{ id: string; key: string }>;
  flags: Array<{ id: string; key: string }>;
  children: ArchitectureNode[];
};

export const DEFAULT_ARCHITECTURE_RULES: ArchitectureRuleConfig = {
  maxDepth: 4,
  minDepth: 1,
  requiredOwner: false,
  requiredDescription: false,
  forbiddenPrefixes: ['new', 'test', 'tmp', 'temp', 'enable', 'flag'],
  temporaryFlagReviewRequired: true,
  staleEnabledDays: 90,
};
