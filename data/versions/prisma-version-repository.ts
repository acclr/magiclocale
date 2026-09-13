import {
  Prisma,
  PrismaClient,
  VersionChangeEntityType as PrismaChangeEntityType,
  VersionStatus as PrismaVersionStatus,
  type Version as PrismaVersion,
  type VersionChange as PrismaVersionChange,
  type VersionLocaleBundle as PrismaVersionLocaleBundle,
} from '@prisma/client';

import type { FlagSetSnapshot } from '../../domain/flags/types';
import type {
  SealVersionInput,
  VersionRepository,
} from '../../domain/versions/repository';
import type {
  CellMetadata,
  LocaleBundleSnapshot,
  NewVersionChange,
  Version,
  VersionChange,
  VersionChangeEntityType,
  VersionStatus,
} from '../../domain/versions/types';
import { prisma } from '../../lib/prisma';

const MAX_NUMBER_ATTEMPTS = 5;

function statusFromPrisma(status: PrismaVersionStatus): VersionStatus {
  return status === PrismaVersionStatus.PUBLISHED ? 'published' : 'draft';
}

function entityTypeFromPrisma(
  type: PrismaChangeEntityType
): VersionChangeEntityType {
  return type === PrismaChangeEntityType.FLAG ? 'flag' : 'translation';
}

function entityTypeToPrisma(
  type: VersionChangeEntityType
): PrismaChangeEntityType {
  return type === 'flag'
    ? PrismaChangeEntityType.FLAG
    : PrismaChangeEntityType.TRANSLATION;
}

function toVersion(version: PrismaVersion): Version {
  return {
    id: version.id,
    environmentId: version.environmentId,
    number: version.number,
    status: statusFromPrisma(version.status),
    message: version.message,
    createdBy: version.createdBy,
    publishedAt: version.publishedAt,
    publishedBy: version.publishedBy,
    promotedFromId: version.promotedFromId,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
}

function toBundle(
  bundle: PrismaVersionLocaleBundle
): LocaleBundleSnapshot {
  return {
    locale: bundle.locale,
    translations: (bundle.translations ?? {}) as Record<string, string>,
    metadata: (bundle.metadata ?? {}) as Record<string, CellMetadata>,
    keyCount: bundle.keyCount,
  };
}

function toChange(change: PrismaVersionChange): VersionChange {
  return {
    id: change.id,
    versionId: change.versionId,
    entityType: entityTypeFromPrisma(change.entityType),
    entityKey: change.entityKey,
    locale: change.locale,
    before: change.before,
    after: change.after,
    actor: change.actor,
    createdAt: change.createdAt,
  };
}

function asJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined
    ? Prisma.JsonNull
    : (value as Prisma.InputJsonValue);
}

export class PrismaVersionRepository implements VersionRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async getVersion(id: string): Promise<Version | null> {
    const version = await this.client.version.findUnique({ where: { id } });
    return version ? toVersion(version) : null;
  }

  async listVersions(environmentId: string, limit = 50): Promise<Version[]> {
    const versions = await this.client.version.findMany({
      where: { environmentId },
      orderBy: { number: 'desc' },
      take: limit,
    });
    return versions.map(toVersion);
  }

  async findDraft(environmentId: string): Promise<Version | null> {
    const draft = await this.client.version.findFirst({
      where: { environmentId, status: PrismaVersionStatus.DRAFT },
      orderBy: { number: 'desc' },
    });
    return draft ? toVersion(draft) : null;
  }

  /**
   * Version numbers are per environment and gapless, so allocation races on
   * the (environmentId, number) unique index. Retry with a recomputed number
   * rather than serializing every save behind a lock.
   */
  async createDraft(input: {
    environmentId: string;
    createdBy: string | null;
  }): Promise<Version> {
    for (let attempt = 1; attempt <= MAX_NUMBER_ATTEMPTS; attempt += 1) {
      const latest = await this.client.version.findFirst({
        where: { environmentId: input.environmentId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });

      try {
        const created = await this.client.version.create({
          data: {
            environmentId: input.environmentId,
            number: (latest?.number ?? 0) + 1,
            status: PrismaVersionStatus.DRAFT,
            createdBy: input.createdBy,
          },
        });
        return toVersion(created);
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2002'
        ) {
          throw error;
        }

        // Another writer either took the number or opened the draft first.
        const existing = await this.findDraft(input.environmentId);
        if (existing) {
          return existing;
        }
        if (attempt === MAX_NUMBER_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error('Unable to allocate a version number');
  }

  async sealVersion(
    versionId: string,
    input: SealVersionInput,
    bundles: LocaleBundleSnapshot[]
  ): Promise<Version> {
    return this.client.$transaction(async (transaction) => {
      // Snapshots are immutable, so re-publishing the same draft replaces any
      // partial bundle set rather than accumulating duplicates.
      await transaction.versionLocaleBundle.deleteMany({
        where: { versionId },
      });

      if (bundles.length > 0) {
        await transaction.versionLocaleBundle.createMany({
          data: bundles.map((bundle) => ({
            versionId,
            locale: bundle.locale,
            translations: bundle.translations as Prisma.InputJsonValue,
            metadata: bundle.metadata as Prisma.InputJsonValue,
            keyCount: bundle.keyCount,
          })),
        });
      }

      const sealed = await transaction.version.update({
        where: { id: versionId },
        data: {
          status: PrismaVersionStatus.PUBLISHED,
          message: input.message,
          publishedBy: input.publishedBy,
          publishedAt: new Date(),
          flagsSnapshot: input.flagsSnapshot as unknown as Prisma.InputJsonValue,
          ...(input.promotedFromId !== undefined
            ? { promotedFromId: input.promotedFromId }
            : {}),
        },
      });

      return toVersion(sealed);
    });
  }

  async appendChange(change: NewVersionChange): Promise<void> {
    await this.client.versionChange.create({
      data: {
        versionId: change.versionId,
        entityType: entityTypeToPrisma(change.entityType),
        entityKey: change.entityKey,
        locale: change.locale,
        before: asJson(change.before),
        after: asJson(change.after),
        actor: change.actor,
      },
    });
  }

  async listChanges(versionId: string): Promise<VersionChange[]> {
    const changes = await this.client.versionChange.findMany({
      where: { versionId },
      orderBy: { createdAt: 'asc' },
    });
    return changes.map(toChange);
  }

  async countChanges(versionId: string): Promise<number> {
    return this.client.versionChange.count({ where: { versionId } });
  }

  async getLocaleBundle(
    versionId: string,
    locale: string
  ): Promise<LocaleBundleSnapshot | null> {
    const bundle = await this.client.versionLocaleBundle.findUnique({
      where: { versionId_locale: { versionId, locale } },
    });
    return bundle ? toBundle(bundle) : null;
  }

  async listLocaleBundles(
    versionId: string
  ): Promise<LocaleBundleSnapshot[]> {
    const bundles = await this.client.versionLocaleBundle.findMany({
      where: { versionId },
      orderBy: { locale: 'asc' },
    });
    return bundles.map(toBundle);
  }

  async getFlagsSnapshot(
    versionId: string
  ): Promise<FlagSetSnapshot | null> {
    const version = await this.client.version.findUnique({
      where: { id: versionId },
      select: { flagsSnapshot: true },
    });
    if (!version?.flagsSnapshot) {
      return null;
    }
    return version.flagsSnapshot as unknown as FlagSetSnapshot;
  }

  /**
   * Keeps the newest `keep` versions. The environment's live version is never
   * pruned, even if it has fallen outside the window after a rollback.
   */
  async pruneHistory(environmentId: string, keep: number): Promise<number> {
    const survivors = await this.client.version.findMany({
      where: { environmentId },
      orderBy: { number: 'desc' },
      take: keep,
      select: { id: true },
    });
    const environment = await this.client.environment.findUnique({
      where: { id: environmentId },
      select: { liveVersionId: true },
    });

    const protectedIds = survivors.map((version) => version.id);
    if (environment?.liveVersionId) {
      protectedIds.push(environment.liveVersionId);
    }

    const result = await this.client.version.deleteMany({
      where: {
        environmentId,
        status: PrismaVersionStatus.PUBLISHED,
        id: { notIn: protectedIds },
      },
    });
    return result.count;
  }
}
