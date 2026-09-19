import {
  Prisma,
  PrismaClient,
  type KeyMigration as PrismaMigration,
  type KeyMigrationOperation as PrismaOperation,
} from '@prisma/client';

import type { KeyType } from '../../domain/keys/types';
import type { MigrationRepository } from '../../domain/migrations/repository';
import type {
  KeyMigration,
  MigrationOperation,
  MigrationOperationInput,
  MigrationOperationType,
  MigrationStatus,
} from '../../domain/migrations/types';
import { prisma } from '../../lib/prisma';

type PrismaKeyTypeValue = 'TRANSLATION' | 'FEATURE_FLAG';
type PrismaMigrationStatusValue = 'DRAFT' | 'READY' | 'APPLIED' | 'CANCELLED';
type PrismaOpTypeValue =
  | 'RENAME_KEY'
  | 'MOVE_KEY'
  | 'MERGE_TRANSLATIONS'
  | 'DEPRECATE_KEY'
  | 'ARCHIVE_KEY'
  | 'DELETE_KEY'
  | 'ASSIGN_OWNER';

const statusToPrisma: Record<MigrationStatus, PrismaMigrationStatusValue> = {
  draft: 'DRAFT',
  ready: 'READY',
  applied: 'APPLIED',
  cancelled: 'CANCELLED',
};

const statusFromPrisma: Record<PrismaMigrationStatusValue, MigrationStatus> = {
  DRAFT: 'draft',
  READY: 'ready',
  APPLIED: 'applied',
  CANCELLED: 'cancelled',
};

const opToPrisma: Record<MigrationOperationType, PrismaOpTypeValue> = {
  'rename-key': 'RENAME_KEY',
  'move-key': 'MOVE_KEY',
  'merge-translations': 'MERGE_TRANSLATIONS',
  'deprecate-key': 'DEPRECATE_KEY',
  'archive-key': 'ARCHIVE_KEY',
  'delete-key': 'DELETE_KEY',
  'assign-owner': 'ASSIGN_OWNER',
};

const opFromPrisma: Record<PrismaOpTypeValue, MigrationOperationType> = {
  RENAME_KEY: 'rename-key',
  MOVE_KEY: 'move-key',
  MERGE_TRANSLATIONS: 'merge-translations',
  DEPRECATE_KEY: 'deprecate-key',
  ARCHIVE_KEY: 'archive-key',
  DELETE_KEY: 'delete-key',
  ASSIGN_OWNER: 'assign-owner',
};

function toType(type: PrismaKeyTypeValue): KeyType {
  return type === 'FEATURE_FLAG' ? 'feature-flag' : 'translation';
}

function toOperation(row: PrismaOperation): MigrationOperation {
  return {
    id: row.id,
    migrationId: row.migrationId,
    order: row.order,
    type: opFromPrisma[row.type as PrismaOpTypeValue],
    keyType: toType(row.keyType as PrismaKeyTypeValue),
    fromKey: row.fromKey,
    toKey: row.toKey,
    payload: (row.payload as Record<string, unknown> | null) ?? null,
  };
}

function toMigration(
  row: PrismaMigration & { operations?: PrismaOperation[] }
): KeyMigration {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    status: statusFromPrisma[row.status as PrismaMigrationStatusValue],
    createdBy: row.createdBy,
    appliedAt: row.appliedAt,
    createdAt: row.createdAt,
    operations: (row.operations ?? [])
      .slice()
      .sort((left, right) => left.order - right.order)
      .map(toOperation),
  };
}

export class PrismaMigrationRepository implements MigrationRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async list(projectId: string): Promise<KeyMigration[]> {
    const rows = await this.client.keyMigration.findMany({
      where: { projectId },
      include: { operations: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toMigration);
  }

  async get(id: string): Promise<KeyMigration | null> {
    const row = await this.client.keyMigration.findUnique({
      where: { id },
      include: { operations: true },
    });
    return row ? toMigration(row) : null;
  }

  async create(input: {
    projectId: string;
    name: string;
    createdBy?: string | null;
    operations: MigrationOperationInput[];
  }): Promise<KeyMigration> {
    const row = await this.client.keyMigration.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        createdBy: input.createdBy ?? null,
        operations: {
          create: input.operations.map((operation, index) => ({
            order: index,
            type: opToPrisma[operation.type],
            keyType:
              operation.keyType === 'feature-flag'
                ? 'FEATURE_FLAG'
                : 'TRANSLATION',
            fromKey: operation.fromKey,
            toKey: operation.toKey ?? null,
            payload:
              operation.payload === undefined
                ? undefined
                : (operation.payload as Prisma.InputJsonValue),
          })),
        },
      },
      include: { operations: true },
    });
    return toMigration(row);
  }

  async updateStatus(
    id: string,
    status: MigrationStatus,
    appliedAt?: Date | null
  ): Promise<KeyMigration> {
    const row = await this.client.keyMigration.update({
      where: { id },
      data: {
        status: statusToPrisma[status],
        ...(appliedAt !== undefined ? { appliedAt } : {}),
      },
      include: { operations: true },
    });
    return toMigration(row);
  }
}
