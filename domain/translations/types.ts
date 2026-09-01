export type TranslationSource = 'ai' | 'manual' | 'code';

export type TranslationStatus = 'ai' | 'manual' | 'source' | 'needs-review';

export type LocaleCode = string;

export type Project = {
  id: string;
  teamId: string;
  name: string;
  sourceLocale: LocaleCode;
  locales: LocaleCode[];
};

export type CreateProjectInput = {
  teamId: string;
  name: string;
  sourceLocale: LocaleCode;
  locales: LocaleCode[];
};

export type UpdateProjectInput = {
  name?: string;
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
  | 'missing';

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
};
