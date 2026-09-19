import type { DetectedKeyInput, KeyLifecycle, KeyMeta, KeyType } from './types';

export interface KeyCatalogWriter {
  recordDetection(input: DetectedKeyInput): Promise<KeyMeta>;
  upsertDefinition(input: {
    projectId: string;
    type: KeyType;
    key: string;
    description?: string | null;
    lifecycle?: KeyLifecycle;
  }): Promise<KeyMeta>;
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
