import type { FlagRepository } from '../flags/repository';
import type { KeyCatalogRepository } from '../keys/repository';
import type { ProjectService } from '../translations/project-service';
import type { TranslationRepository } from '../translations/repository';
import type { MigrationRepository } from './repository';
import type {
  KeyMigration,
  MigrationOperation,
  MigrationOperationInput,
} from './types';

export class MigrationService {
  constructor(
    private readonly repository: MigrationRepository,
    private readonly keys: KeyCatalogRepository,
    private readonly translations: TranslationRepository,
    private readonly flags: FlagRepository,
    private readonly projectService: ProjectService
  ) {}

  async list(teamId: string, projectId: string): Promise<KeyMigration[]> {
    const project = await this.projectService.get(teamId, projectId);
    return this.repository.list(project.id);
  }

  async get(teamId: string, projectId: string, migrationId: string) {
    const project = await this.projectService.get(teamId, projectId);
    const migration = await this.repository.get(migrationId);
    if (!migration || migration.projectId !== project.id) {
      throw new Error(`Migration not found: ${migrationId}`);
    }
    return migration;
  }

  async create(
    teamId: string,
    projectId: string,
    name: string,
    operations: MigrationOperationInput[],
    createdBy?: string | null
  ): Promise<KeyMigration> {
    const project = await this.projectService.get(teamId, projectId);
    if (!name.trim()) {
      throw new Error('Migration name is required');
    }
    if (!operations.length) {
      throw new Error('A migration needs at least one operation');
    }
    return this.repository.create({
      projectId: project.id,
      name: name.trim(),
      createdBy: createdBy ?? null,
      operations,
    });
  }

  async apply(
    teamId: string,
    projectId: string,
    migrationId: string
  ): Promise<KeyMigration> {
    const migration = await this.get(teamId, projectId, migrationId);
    if (migration.status === 'applied') {
      return migration;
    }
    if (migration.status === 'cancelled') {
      throw new Error('Cancelled migrations cannot be applied');
    }

    for (const operation of [...migration.operations].sort(
      (left, right) => left.order - right.order
    )) {
      await this.applyOperation(migration.projectId, operation);
    }

    return this.repository.updateStatus(migration.id, 'applied', new Date());
  }

  exportForCli(migration: KeyMigration) {
    return {
      id: migration.id,
      name: migration.name,
      operations: migration.operations.map((operation) => ({
        type: operation.type,
        keyType: operation.keyType,
        fromKey: operation.fromKey,
        toKey: operation.toKey,
      })),
    };
  }

  private async applyOperation(
    projectId: string,
    operation: MigrationOperation
  ): Promise<void> {
    switch (operation.type) {
      case 'rename-key':
      case 'move-key':
        if (!operation.toKey) {
          throw new Error('Rename operations require toKey');
        }
        await this.keys.rename(
          projectId,
          operation.keyType,
          operation.fromKey,
          operation.toKey
        );
        if (operation.keyType === 'translation') {
          const existing = await this.translations.findKeyByName(
            projectId,
            operation.fromKey
          );
          if (existing) {
            await this.translations.renameKey(existing.id, operation.toKey);
          }
        } else {
          const flag = await this.flags.findFlagByKey(
            projectId,
            operation.fromKey
          );
          if (flag) {
            await this.flags.renameFlag(flag.id, operation.toKey);
          }
        }
        return;
      case 'deprecate-key':
        await this.setLifecycle(projectId, operation, 'deprecated');
        return;
      case 'archive-key':
        await this.setLifecycle(projectId, operation, 'archived');
        if (operation.keyType === 'feature-flag') {
          const flag = await this.flags.findFlagByKey(
            projectId,
            operation.fromKey
          );
          if (flag) {
            await this.flags.updateFlag(flag.id, { archived: true });
          }
        }
        return;
      case 'delete-key': {
        const meta = await this.keys.findByKey(
          projectId,
          operation.keyType,
          operation.fromKey
        );
        if (meta) {
          await this.keys.delete(meta.id);
        }
        if (operation.keyType === 'feature-flag') {
          const flag = await this.flags.findFlagByKey(
            projectId,
            operation.fromKey
          );
          if (flag) {
            await this.flags.deleteFlag(flag.id);
          }
        }
        return;
      }
      case 'assign-owner': {
        const meta = await this.keys.findByKey(
          projectId,
          operation.keyType,
          operation.fromKey
        );
        const owner =
          typeof operation.payload?.owner === 'string'
            ? operation.payload.owner
            : null;
        if (meta) {
          await this.keys.update(meta.id, { owner });
        }
        return;
      }
      case 'merge-translations':
        await this.setLifecycle(projectId, operation, 'deprecated');
        return;
      default:
        return;
    }
  }

  private async setLifecycle(
    projectId: string,
    operation: MigrationOperation,
    lifecycle: 'deprecated' | 'archived'
  ) {
    const meta = await this.keys.findByKey(
      projectId,
      operation.keyType,
      operation.fromKey
    );
    if (meta) {
      await this.keys.update(meta.id, {
        lifecycle,
        replacementKey: operation.toKey,
      });
    }
  }
}
