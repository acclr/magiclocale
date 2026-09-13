import type { FlagSetSnapshot } from '../flags/types';
import type {
  LocaleBundleSnapshot,
  NewVersionChange,
  Version,
  VersionChange,
} from './types';

export type SealVersionInput = {
  message: string | null;
  publishedBy: string | null;
  flagsSnapshot: FlagSetSnapshot;
  promotedFromId?: string | null;
};

export interface VersionReader {
  getVersion(id: string): Promise<Version | null>;
  listVersions(environmentId: string, limit?: number): Promise<Version[]>;
  findDraft(environmentId: string): Promise<Version | null>;
  getLocaleBundle(
    versionId: string,
    locale: string
  ): Promise<LocaleBundleSnapshot | null>;
  listLocaleBundles(versionId: string): Promise<LocaleBundleSnapshot[]>;
  getFlagsSnapshot(versionId: string): Promise<FlagSetSnapshot | null>;
}

export interface VersionRepository extends VersionReader {
  createDraft(input: {
    environmentId: string;
    createdBy: string | null;
  }): Promise<Version>;

  /**
   * Seals a draft and writes its immutable snapshots in a single transaction,
   * so a published version can never be observed without its bundles.
   */
  sealVersion(
    versionId: string,
    input: SealVersionInput,
    bundles: LocaleBundleSnapshot[]
  ): Promise<Version>;

  appendChange(change: NewVersionChange): Promise<void>;
  listChanges(versionId: string): Promise<VersionChange[]>;
  countChanges(versionId: string): Promise<number>;

  /** Drops published versions beyond the retention window. */
  pruneHistory(environmentId: string, keep: number): Promise<number>;
}
