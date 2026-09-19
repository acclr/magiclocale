export type KeyType = 'translation' | 'feature-flag';

export type KeyLifecycle = 'active' | 'unused' | 'deprecated' | 'archived';

export const KEY_TYPES: KeyType[] = ['translation', 'feature-flag'];

export const KEY_LIFECYCLES: KeyLifecycle[] = [
  'active',
  'unused',
  'deprecated',
  'archived',
];

export type SourceUsage = {
  id: string;
  keyMetaId: string;
  file: string;
  line: number;
  column: number | null;
  repository: string | null;
  branch: string | null;
  lastSeenAt: Date;
};

export type SourceUsageInput = {
  file: string;
  line: number;
  column?: number | null;
  repository?: string | null;
  branch?: string | null;
};

export type KeyMeta = {
  id: string;
  projectId: string;
  type: KeyType;
  key: string;
  namespace: string | null;
  description: string | null;
  developerNote: string | null;
  owner: string | null;
  tags: string[];
  lifecycle: KeyLifecycle;
  lastDetectedAt: Date | null;
  replacementKey: string | null;
  reviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
};

export type KeyMetaPatch = {
  description?: string | null;
  developerNote?: string | null;
  owner?: string | null;
  tags?: string[];
  lifecycle?: KeyLifecycle;
  replacementKey?: string | null;
  reviewAt?: Date | null;
};

export type DetectedKeyInput = {
  projectId: string;
  type: KeyType;
  key: string;
  usage?: SourceUsageInput | null;
};

export type CatalogQuery = {
  search?: string;
  type?: KeyType | 'all';
  lifecycle?: KeyLifecycle | 'all';
  namespace?: string;
  owner?: string;
  usage?: number;
  file?: string;
  page?: number;
  pageSize?: number;
};

export type CatalogList = {
  items: KeyMeta[];
  total: number;
  page: number;
  pageSize: number;
};
