import {
  Prisma,
  PrismaClient,
  type KeyMeta as PrismaKeyMeta,
  type SourceUsage as PrismaSourceUsage,
} from '@prisma/client';

import { namespaceFromKey } from '../../domain/keys/namespace';
import type { KeyCatalogRepository } from '../../domain/keys/repository';
import type {
  CatalogList,
  CatalogQuery,
  DetectedKeyInput,
  KeyLifecycle,
  KeyMeta,
  KeyMetaPatch,
  KeyType,
  SourceUsage,
} from '../../domain/keys/types';
import { prisma } from '../../lib/prisma';

type PrismaKeyTypeValue = 'TRANSLATION' | 'FEATURE_FLAG';
type PrismaKeyLifecycleValue = 'ACTIVE' | 'UNUSED' | 'DEPRECATED' | 'ARCHIVED';

const typeToPrisma: Record<KeyType, PrismaKeyTypeValue> = {
  translation: 'TRANSLATION',
  'feature-flag': 'FEATURE_FLAG',
};

const typeFromPrisma: Record<PrismaKeyTypeValue, KeyType> = {
  TRANSLATION: 'translation',
  FEATURE_FLAG: 'feature-flag',
};

const DETECTION_TOUCH_MS = 60 * 60 * 1000;

const lifecycleToPrisma: Record<KeyLifecycle, PrismaKeyLifecycleValue> = {
  active: 'ACTIVE',
  unused: 'UNUSED',
  deprecated: 'DEPRECATED',
  archived: 'ARCHIVED',
};

const lifecycleFromPrisma: Record<PrismaKeyLifecycleValue, KeyLifecycle> = {
  ACTIVE: 'active',
  UNUSED: 'unused',
  DEPRECATED: 'deprecated',
  ARCHIVED: 'archived',
};

function toMeta(row: PrismaKeyMeta & { _count?: { usages: number } }): KeyMeta {
  return {
    id: row.id,
    projectId: row.projectId,
    type: typeFromPrisma[row.type as PrismaKeyTypeValue],
    key: row.key,
    namespace: row.namespace,
    description: row.description,
    developerNote: row.developerNote,
    owner: row.owner,
    tags: row.tags,
    lifecycle: lifecycleFromPrisma[row.lifecycle as PrismaKeyLifecycleValue],
    lastDetectedAt: row.lastDetectedAt,
    replacementKey: row.replacementKey,
    reviewAt: row.reviewAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    usageCount: row._count?.usages ?? 0,
  };
}

function toUsage(row: PrismaSourceUsage): SourceUsage {
  return {
    id: row.id,
    keyMetaId: row.keyMetaId,
    file: row.file,
    line: row.line,
    column: row.column,
    repository: row.repository,
    branch: row.branch,
    lastSeenAt: row.lastSeenAt,
  };
}

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

export class PrismaKeyCatalogRepository implements KeyCatalogRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async get(id: string): Promise<KeyMeta | null> {
    const row = await this.client.keyMeta.findUnique({
      where: { id },
      include: { _count: { select: { usages: true } } },
    });
    return row ? toMeta(row) : null;
  }

  async findByKey(
    projectId: string,
    type: KeyType,
    key: string
  ): Promise<KeyMeta | null> {
    const row = await this.client.keyMeta.findUnique({
      where: {
        projectId_type_key: {
          projectId,
          type: typeToPrisma[type],
          key,
        },
      },
      include: { _count: { select: { usages: true } } },
    });
    return row ? toMeta(row) : null;
  }

  async list(
    projectId: string,
    query: CatalogQuery = {}
  ): Promise<CatalogList> {
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 50));
    const page = Math.max(1, query.page ?? 1);
    const where: Prisma.KeyMetaWhereInput = { projectId };

    if (query.type && query.type !== 'all') {
      where.type = typeToPrisma[query.type];
    }
    if (query.lifecycle && query.lifecycle !== 'all') {
      where.lifecycle = lifecycleToPrisma[query.lifecycle];
    }
    if (query.namespace) {
      where.namespace = { startsWith: query.namespace };
    }
    if (query.owner) {
      where.owner = { contains: query.owner, mode: 'insensitive' };
    }
    if (query.usage === 0) {
      where.usages = { none: {} };
    } else {
      const some: Prisma.SourceUsageWhereInput = {};
      if (query.file) {
        some.file = { contains: query.file, mode: 'insensitive' };
      }
      if (
        query.file ||
        (query.usage !== undefined && !Number.isNaN(query.usage))
      ) {
        where.usages = { some };
      }
    }
    if (query.search) {
      const search = query.search;
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { owner: { contains: search, mode: 'insensitive' } },
        { namespace: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.client.keyMeta.count({ where }),
      this.client.keyMeta.findMany({
        where,
        include: { _count: { select: { usages: true } } },
        orderBy: { key: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map(toMeta),
      total,
      page,
      pageSize,
    };
  }

  async listAll(projectId: string): Promise<KeyMeta[]> {
    const rows = await this.client.keyMeta.findMany({
      where: { projectId },
      include: { _count: { select: { usages: true } } },
      orderBy: { key: 'asc' },
    });
    return rows.map(toMeta);
  }

  async upsert(input: {
    projectId: string;
    type: KeyType;
    key: string;
    description?: string | null;
    lifecycle?: KeyLifecycle;
  }): Promise<KeyMeta> {
    const namespace = namespaceFromKey(input.key);
    const where = {
      projectId_type_key: {
        projectId: input.projectId,
        type: typeToPrisma[input.type],
        key: input.key,
      },
    };
    const create = {
      projectId: input.projectId,
      type: typeToPrisma[input.type],
      key: input.key,
      namespace,
      description: input.description ?? null,
      lifecycle: input.lifecycle
        ? lifecycleToPrisma[input.lifecycle]
        : 'ACTIVE',
    };
    const update = {
      namespace,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.lifecycle
        ? { lifecycle: lifecycleToPrisma[input.lifecycle] }
        : {}),
    };

    try {
      const row = await this.client.keyMeta.upsert({
        where,
        create,
        update,
        include: { _count: { select: { usages: true } } },
      });
      return toMeta(row);
    } catch (error) {
      // Two landing-page syncs can create the same key at once. Prisma
      // upsert is not atomic under that race and raises P2002.
      if (!isPrismaErrorWithCode(error, 'P2002')) {
        throw error;
      }
      const existing = await this.client.keyMeta.findUnique({
        where,
        include: { _count: { select: { usages: true } } },
      });
      if (!existing) {
        throw error;
      }
      const row = await this.client.keyMeta.update({
        where: { id: existing.id },
        data: update,
        include: { _count: { select: { usages: true } } },
      });
      return toMeta(row);
    }
  }

  async update(id: string, patch: KeyMetaPatch): Promise<KeyMeta> {
    const row = await this.client.keyMeta.update({
      where: { id },
      data: {
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
        ...(patch.developerNote !== undefined
          ? { developerNote: patch.developerNote }
          : {}),
        ...(patch.owner !== undefined ? { owner: patch.owner } : {}),
        ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        ...(patch.lifecycle !== undefined
          ? { lifecycle: lifecycleToPrisma[patch.lifecycle] }
          : {}),
        ...(patch.replacementKey !== undefined
          ? { replacementKey: patch.replacementKey }
          : {}),
        ...(patch.reviewAt !== undefined ? { reviewAt: patch.reviewAt } : {}),
      },
      include: { _count: { select: { usages: true } } },
    });
    return toMeta(row);
  }

  async rename(
    projectId: string,
    type: KeyType,
    fromKey: string,
    toKey: string
  ): Promise<KeyMeta> {
    const existing = await this.findByKey(projectId, type, fromKey);
    if (!existing) {
      throw new Error(`Key not found: ${fromKey}`);
    }
    const row = await this.client.keyMeta.update({
      where: { id: existing.id },
      data: { key: toKey, namespace: namespaceFromKey(toKey) },
      include: { _count: { select: { usages: true } } },
    });
    return toMeta(row);
  }

  async deprecateMissingTranslations(
    projectId: string,
    keys: readonly string[]
  ): Promise<string[]> {
    const names = Array.from(
      new Set(keys.map((key) => key.trim()).filter(Boolean))
    );
    if (names.length === 0) {
      return [];
    }

    const translationKeys = await this.client.translationKey.findMany({
      where: { projectId, key: { in: names } },
      select: { key: true },
    });
    const known = new Set(translationKeys.map((row) => row.key));
    const targets = names.filter((key) => known.has(key));
    if (targets.length === 0) {
      return [];
    }

    const existing = await this.client.keyMeta.findMany({
      where: {
        projectId,
        type: 'TRANSLATION',
        key: { in: targets },
      },
      select: { id: true, key: true, lifecycle: true },
    });
    const byKey = new Map(existing.map((meta) => [meta.key, meta]));
    const updateIds: string[] = [];
    const createKeys: string[] = [];
    const changed: string[] = [];

    for (const key of targets) {
      const meta = byKey.get(key);
      if (!meta) {
        createKeys.push(key);
        changed.push(key);
        continue;
      }
      if (meta.lifecycle === 'DEPRECATED' || meta.lifecycle === 'ARCHIVED') {
        continue;
      }
      updateIds.push(meta.id);
      changed.push(key);
    }

    if (changed.length === 0) {
      return [];
    }

    await this.client.$transaction([
      ...(updateIds.length > 0
        ? [
            this.client.sourceUsage.deleteMany({
              where: { keyMetaId: { in: updateIds } },
            }),
            this.client.keyMeta.updateMany({
              where: { id: { in: updateIds } },
              data: { lifecycle: 'DEPRECATED' },
            }),
          ]
        : []),
      ...(createKeys.length > 0
        ? [
            this.client.keyMeta.createMany({
              data: createKeys.map((key) => ({
                projectId,
                type: 'TRANSLATION' as const,
                key,
                namespace: namespaceFromKey(key),
                lifecycle: 'DEPRECATED' as const,
              })),
            }),
          ]
        : []),
    ]);
    return changed;
  }

  async touchDetections(input: {
    projectId: string;
    type: KeyType;
    keys: string[];
  }): Promise<void> {
    const keys = Array.from(
      new Set(input.keys.map((key) => key.trim()).filter(Boolean))
    );
    if (keys.length === 0) {
      return;
    }

    const staleBefore = new Date(Date.now() - DETECTION_TOUCH_MS);
    await this.client.keyMeta.updateMany({
      where: {
        projectId: input.projectId,
        type: typeToPrisma[input.type],
        key: { in: keys },
        lifecycle: { notIn: ['DEPRECATED', 'ARCHIVED'] },
        OR: [{ lastDetectedAt: null }, { lastDetectedAt: { lt: staleBefore } }],
      },
      data: {
        lastDetectedAt: new Date(),
        lifecycle: 'ACTIVE',
      },
    });
  }

  async recordDetection(input: DetectedKeyInput): Promise<KeyMeta> {
    const key = input.key.trim();
    const existing = await this.findByKey(input.projectId, input.type, key);
    if (
      existing?.lastDetectedAt &&
      Date.now() - existing.lastDetectedAt.getTime() < DETECTION_TOUCH_MS &&
      !input.usage?.file
    ) {
      return existing;
    }

    const meta = await this.upsert({
      projectId: input.projectId,
      type: input.type,
      key,
    });
    const usage = input.usage;
    if (usage?.file) {
      const column = usage.column ?? 0;
      await this.client.sourceUsage.upsert({
        where: {
          keyMetaId_file_line_column: {
            keyMetaId: meta.id,
            file: usage.file,
            line: usage.line,
            column,
          },
        },
        create: {
          keyMetaId: meta.id,
          file: usage.file,
          line: usage.line,
          column,
          repository: usage.repository ?? null,
          branch: usage.branch ?? null,
          lastSeenAt: new Date(),
        },
        update: {
          repository: usage.repository ?? null,
          branch: usage.branch ?? null,
          lastSeenAt: new Date(),
        },
      });
    }

    const withUsages = await this.client.keyMeta.update({
      where: { id: meta.id },
      data: {
        lastDetectedAt: new Date(),
        lifecycle:
          meta.lifecycle === 'archived'
            ? 'ARCHIVED'
            : 'ACTIVE',
      },
      include: { _count: { select: { usages: true } } },
    });
    return toMeta(withUsages);
  }

  async listUsages(keyMetaId: string): Promise<SourceUsage[]> {
    const rows = await this.client.sourceUsage.findMany({
      where: { keyMetaId },
      orderBy: [{ file: 'asc' }, { line: 'asc' }],
    });
    return rows.map(toUsage);
  }

  async listUsagesForProject(projectId: string): Promise<SourceUsage[]> {
    const rows = await this.client.sourceUsage.findMany({
      where: { keyMeta: { projectId } },
      orderBy: [{ file: 'asc' }, { line: 'asc' }],
    });
    return rows.map(toUsage);
  }

  async delete(id: string): Promise<void> {
    await this.client.keyMeta.delete({ where: { id } });
  }
}
