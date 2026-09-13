import type { FlagSetSnapshot, FlagSnapshot } from '../flags/types';
import type {
  TranslationSource,
  TranslationStatus,
} from '../translations/types';

export type VersionStatus = 'draft' | 'published';

export type Version = {
  id: string;
  environmentId: string;
  number: number;
  status: VersionStatus;
  message: string | null;
  createdBy: string | null;
  publishedAt: Date | null;
  publishedBy: string | null;
  promotedFromId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Authoring metadata for one snapshotted cell. */
export type CellMetadata = {
  source: TranslationSource;
  status: TranslationStatus;
  aiLocked: boolean;
};

export type LocaleBundleSnapshot = {
  locale: string;
  translations: Record<string, string>;
  metadata: Record<string, CellMetadata>;
  keyCount: number;
};

export type VersionSnapshot = {
  locales: LocaleBundleSnapshot[];
  flags: FlagSetSnapshot;
};

export type VersionChangeEntityType = 'translation' | 'flag';

export type VersionChange = {
  id: string;
  versionId: string;
  entityType: VersionChangeEntityType;
  entityKey: string;
  locale: string | null;
  before: unknown;
  after: unknown;
  actor: string | null;
  createdAt: Date;
};

export type NewVersionChange = {
  versionId: string;
  entityType: VersionChangeEntityType;
  entityKey: string;
  locale: string | null;
  before: unknown;
  after: unknown;
  actor: string | null;
};

export type DiffKind = 'added' | 'changed' | 'removed';

export type TranslationDiffEntry = {
  entityType: 'translation';
  kind: DiffKind;
  key: string;
  locale: string;
  before: string | null;
  after: string | null;
};

export type FlagDiffEntry = {
  entityType: 'flag';
  kind: DiffKind;
  key: string;
  before: FlagSnapshot | null;
  after: FlagSnapshot | null;
};

export type DiffEntry = TranslationDiffEntry | FlagDiffEntry;

export type VersionDiff = {
  entries: DiffEntry[];
  translationCount: number;
  flagCount: number;
  total: number;
};

/* ---------- Promotion ---------- */

export type PromotionAction = 'apply' | 'skip-conflict' | 'unchanged';

export type PromotionEntry = {
  key: string;
  locale: string;
  action: PromotionAction;
  incoming: string;
  incomingSource: TranslationSource;
  current: string | null;
  /** Set when a human-owned target value is protected from an AI-written one. */
  conflictReason?: 'human-owned-target';
};

export type PromotionPlan = {
  sourceEnvironmentId: string;
  targetEnvironmentId: string;
  sourceVersionId: string;
  sourceVersionNumber: number;
  entries: PromotionEntry[];
  applyCount: number;
  conflictCount: number;
  unchangedCount: number;
  flagCount: number;
};

export type PublishResult = {
  version: Version;
  /** False when the working copy already matched the live version. */
  changed: boolean;
  localeCount: number;
  flagCount: number;
};

export const MAX_VERSION_HISTORY = 50;
