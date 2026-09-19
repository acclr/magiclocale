import type { FlagSnapshot } from './types';

export type FlagChange = {
  environmentId: string;
  key: string;
  before: FlagSnapshot | null;
  after: FlagSnapshot | null;
  actor?: string | null;
  reason?: string | null;
};

/**
 * Port the flag domain uses to report edits into the environment's open draft
 * version. Mirrors `TranslationChangeRecorder` so the version service can
 * satisfy both without either domain depending on it.
 */
export interface FlagChangeRecorder {
  recordFlagChange(change: FlagChange): Promise<void>;
}

export const noopFlagChangeRecorder: FlagChangeRecorder = {
  async recordFlagChange() {
    // Recording is optional: unit tests and read-only paths omit it.
  },
};
