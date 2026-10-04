import type {
  CatalogList,
  CatalogQuery,
  DetectedKeyInput,
  KeyLifecycle,
  KeyMeta,
  KeyMetaPatch,
  KeyType,
  SourceUsage,
} from './types';

export type UpsertKeyMetaInput = {
  projectId: string;
  type: KeyType;
  key: string;
  description?: string | null;
  lifecycle?: KeyLifecycle;
};

export interface KeyCatalogRepository {
  get(id: string): Promise<KeyMeta | null>;
  findByKey(
    projectId: string,
    type: KeyType,
    key: string
  ): Promise<KeyMeta | null>;
  list(projectId: string, query?: CatalogQuery): Promise<CatalogList>;
  listAll(projectId: string): Promise<KeyMeta[]>;
  upsert(input: UpsertKeyMetaInput): Promise<KeyMeta>;
  update(id: string, patch: KeyMetaPatch): Promise<KeyMeta>;
  rename(
    projectId: string,
    type: KeyType,
    fromKey: string,
    toKey: string
  ): Promise<KeyMeta>;
  recordDetection(input: DetectedKeyInput): Promise<KeyMeta>;
  /**
   * Marks translation keys that disappeared from a full source scan.
   * Archived keys stay archived. Returns the names that changed.
   */
  deprecateMissingTranslations(
    projectId: string,
    keys: readonly string[]
  ): Promise<string[]>;
  touchDetections(input: {
    projectId: string;
    type: KeyType;
    keys: string[];
  }): Promise<void>;
  listUsages(keyMetaId: string): Promise<SourceUsage[]>;
  listUsagesForProject(projectId: string): Promise<SourceUsage[]>;
  delete(id: string): Promise<void>;
}
