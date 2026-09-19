import type { BillingScope } from '../billing';
import type { LocaleFormat } from './locale-catalog';

export type TranslationSource = 'ai' | 'manual' | 'code';

export type TranslationStatus = 'ai' | 'manual' | 'source' | 'needs-review';

export type LocaleCode = string;

export type Project = {
  id: string;
  teamId: string;
  name: string;
  sourceLocale: LocaleCode;
  locales: LocaleCode[];
  localeFormat: LocaleFormat;
  billingScope: BillingScope;
  billingId: string | null;
};

export type CreateProjectInput = {
  teamId: string;
  name: string;
  sourceLocale: LocaleCode;
  locales: LocaleCode[];
  localeFormat?: LocaleFormat;
  billingScope?: BillingScope;
};

export type UpdateProjectInput = {
  name?: string;
  billingScope?: BillingScope;
  billingId?: string | null;
  billingProvider?: string | null;
};

export type TranslationKey = {
  id: string;
  projectId: string;
  key: string;
  sourceText: string;
};

export type Translation = {
  id: string;
  translationKeyId: string;
  /**
   * Translation values are the per-environment working copy. The key catalog
   * they hang off stays project-wide.
   */
  environmentId: string;
  locale: LocaleCode;
  value: string;
  source: TranslationSource;
  /**
   * Once true, automatic AI processes may never modify this translation.
   * Set as soon as a human edit is persisted.
   */
  aiLocked: boolean;
  status: TranslationStatus;
  updatedAt: Date;
};

export type TranslationFilter =
  | 'all'
  | 'ai'
  | 'manual'
  | 'needs-review'
  | 'missing'
  | 'unused'
  | 'deprecated';

export type AutomaticAiSkipReason =
  | 'ai-locked'
  | 'human-owned'
  | 'already-exists';

export type AutomaticAiWriteResult =
  | { outcome: 'written'; translation: Translation }
  | {
      outcome: 'skipped';
      reason: AutomaticAiSkipReason;
      translation?: Translation;
    };

export type IncomingSourceKey = {
  key: string;
  sourceText: string;
  type?: 'translation' | 'feature-flag';
  usage?: {
    file: string;
    line: number;
    column?: number | null;
    repository?: string | null;
    branch?: string | null;
  } | null;
};
