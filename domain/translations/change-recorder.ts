import type { Translation } from './types';

export type TranslationCellSnapshot = Pick<
  Translation,
  'value' | 'source' | 'status' | 'aiLocked'
>;

export type TranslationChange = {
  environmentId: string;
  key: string;
  locale: string;
  before: TranslationCellSnapshot | null;
  after: TranslationCellSnapshot | null;
  actor?: string | null;
};

/**
 * Port the translation domain uses to report edits into the environment's
 * open draft version. Declared here so translations never has to depend on
 * the versioning module; the version service satisfies it structurally.
 */
export interface TranslationChangeRecorder {
  recordTranslationChange(change: TranslationChange): Promise<void>;
}

export const noopTranslationChangeRecorder: TranslationChangeRecorder = {
  async recordTranslationChange() {
    // Recording is optional: unit tests and read-only paths omit it.
  },
};

export function toCellSnapshot(
  translation: Translation | null | undefined
): TranslationCellSnapshot | null {
  if (!translation) {
    return null;
  }
  return {
    value: translation.value,
    source: translation.source,
    status: translation.status,
    aiLocked: translation.aiLocked,
  };
}
