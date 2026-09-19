import type { KeyType } from '../keys/types';

export type MigrationStatus = 'draft' | 'ready' | 'applied' | 'cancelled';

export type MigrationOperationType =
  | 'rename-key'
  | 'move-key'
  | 'merge-translations'
  | 'deprecate-key'
  | 'archive-key'
  | 'delete-key'
  | 'assign-owner';

export type MigrationOperation = {
  id: string;
  migrationId: string;
  order: number;
  type: MigrationOperationType;
  keyType: KeyType;
  fromKey: string;
  toKey: string | null;
  payload: Record<string, unknown> | null;
};

export type KeyMigration = {
  id: string;
  projectId: string;
  name: string;
  status: MigrationStatus;
  createdBy: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  operations: MigrationOperation[];
};

export type MigrationOperationInput = {
  type: MigrationOperationType;
  keyType: KeyType;
  fromKey: string;
  toKey?: string | null;
  payload?: Record<string, unknown> | null;
};
