import type { KeyMigration, MigrationOperationInput } from './types';

export interface MigrationRepository {
  list(projectId: string): Promise<KeyMigration[]>;
  get(id: string): Promise<KeyMigration | null>;
  create(input: {
    projectId: string;
    name: string;
    createdBy?: string | null;
    operations: MigrationOperationInput[];
  }): Promise<KeyMigration>;
  updateStatus(
    id: string,
    status: KeyMigration['status'],
    appliedAt?: Date | null
  ): Promise<KeyMigration>;
}
