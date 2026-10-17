import type {
  DetectedKeyInput,
  KeyLifecycle,
  KeyMeta,
  KeyType,
  SourceUsage,
} from './types';

export interface KeyCatalogWriter {
  recordDetection(input: DetectedKeyInput): Promise<KeyMeta>;
  /**
   * Marks keys seen again without inserting rows or rewriting fresh detections.
   * Missing keys are left untouched so the caller can still create them.
   */
  touchDetections?(input: {
    projectId: string;
    type: KeyType;
    keys: string[];
  }): Promise<void>;
  upsertDefinition(input: {
    projectId: string;
    type: KeyType;
    key: string;
    description?: string | null;
    lifecycle?: KeyLifecycle;
  }): Promise<KeyMeta>;
  listAll?(projectId: string): Promise<KeyMeta[]>;
  listUsagesForProject?(projectId: string): Promise<SourceUsage[]>;
  renameDetectedKey?(input: {
    projectId: string;
    type: KeyType;
    fromKey: string;
    toKey: string;
    usage?: DetectedKeyInput['usage'];
  }): Promise<KeyMeta>;
  markMergedKeys?(input: {
    projectId: string;
    fromKeys: readonly string[];
    toKey: string;
  }): Promise<void>;
}

export const noopKeyCatalogWriter: KeyCatalogWriter = {
  async recordDetection(input) {
    return {
      id: `${input.projectId}:${input.type}:${input.key}`,
      projectId: input.projectId,
      type: input.type,
      key: input.key,
      namespace: null,
      description: null,
      developerNote: null,
      owner: null,
      tags: [],
      lifecycle: 'active',
      lastDetectedAt: new Date(),
      replacementKey: null,
      reviewAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: input.usage ? 1 : 0,
    };
  },
  async upsertDefinition(input) {
    return this.recordDetection(input);
  },
};
