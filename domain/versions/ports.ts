import type { FlagSetSnapshot } from '../flags/types';

/**
 * Publishing has to freeze the environment's flag configuration alongside its
 * translations. Declared as a port so the version service never depends on
 * the flag service directly; `FlagService` satisfies it structurally.
 */
export interface FlagSnapshotProvider {
  buildSnapshot(environmentId: string): Promise<FlagSetSnapshot>;
}
