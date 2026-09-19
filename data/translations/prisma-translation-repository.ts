import {
  Prisma,
  PrismaClient,
  BillingScope as PrismaBillingScope,
  LocaleFormat as PrismaLocaleFormat,
  TranslationSource as PrismaTranslationSource,
  TranslationStatus as PrismaTranslationStatus,
  type Translation as PrismaTranslation,
  type TranslationKey as PrismaTranslationKey,
  type TranslationProject as PrismaTranslationProject,
} from '@prisma/client';

import type {
  ProjectRepository,
  TranslationRepository,
} from '../../domain/translations/repository';
import type {
  CreateProjectInput,
  Project,
  Translation,
  TranslationKey,
  TranslationSource,
  TranslationStatus,
  UpdateProjectInput,
} from '../../domain/translations/types';
import type { LocaleFormat } from '../../domain/translations/locale-catalog';
import type { BillingScope } from '../../domain/billing';
import { prisma } from '../../lib/prisma';

const MAX_TRANSACTION_ATTEMPTS = 3;

const sourceToPrisma: Record<TranslationSource, PrismaTranslationSource> = {
  ai: PrismaTranslationSource.AI,
  manual: PrismaTranslationSource.MANUAL,
  code: PrismaTranslationSource.CODE,
};

const statusToPrisma: Record<TranslationStatus, PrismaTranslationStatus> = {
  ai: PrismaTranslationStatus.AI,
  manual: PrismaTranslationStatus.MANUAL,
  source: PrismaTranslationStatus.SOURCE,
  'needs-review': PrismaTranslationStatus.NEEDS_REVIEW,
};

function sourceFromPrisma(source: PrismaTranslationSource): TranslationSource {
  switch (source) {
    case PrismaTranslationSource.AI:
      return 'ai';
    case PrismaTranslationSource.MANUAL:
      return 'manual';
    case PrismaTranslationSource.CODE:
      return 'code';
  }
}

function statusFromPrisma(status: PrismaTranslationStatus): TranslationStatus {
  switch (status) {
    case PrismaTranslationStatus.AI:
      return 'ai';
    case PrismaTranslationStatus.MANUAL:
      return 'manual';
    case PrismaTranslationStatus.SOURCE:
      return 'source';
    case PrismaTranslationStatus.NEEDS_REVIEW:
      return 'needs-review';
  }
}

function billingScopeToPrisma(scope: BillingScope): PrismaBillingScope {
  return (scope === 'project' ? 'PROJECT' : 'TEAM') as PrismaBillingScope;
}

function billingScopeFromPrisma(
  scope: PrismaBillingScope | string | null | undefined
): BillingScope {
  return scope === 'PROJECT' ? 'project' : 'team';
}

function localeFormatToPrisma(format: LocaleFormat): PrismaLocaleFormat {
  return format === 'regional'
    ? PrismaLocaleFormat.REGIONAL
    : PrismaLocaleFormat.LANGUAGE;
}

function localeFormatFromPrisma(format: unknown): LocaleFormat {
  return format === PrismaLocaleFormat.REGIONAL || format === 'REGIONAL'
    ? 'regional'
    : 'language';
}

function toProject(project: PrismaTranslationProject): Project {
  return {
    id: project.id,
    teamId: project.teamId,
    name: project.name,
    sourceLocale: project.sourceLocale,
    locales: project.locales,
    localeFormat: localeFormatFromPrisma(project.localeFormat),
    billingScope: billingScopeFromPrisma(project.billingScope),
    billingId: project.billingId,
  };
}

function toKey(key: PrismaTranslationKey): TranslationKey {
  return {
    id: key.id,
    projectId: key.projectId,
    key: key.key,
    sourceText: key.sourceText,
  };
}

function toTranslation(translation: PrismaTranslation): Translation {
  return {
    id: translation.id,
    translationKeyId: translation.translationKeyId,
    environmentId: translation.environmentId,
    locale: translation.locale,
    value: translation.value,
    source: sourceFromPrisma(translation.source),
    aiLocked: translation.aiLocked,
    status: statusFromPrisma(translation.status),
    updatedAt: translation.updatedAt,
  };
}

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

/**
 * Prisma-backed persistence for translation projects, keys, and values.
 *
 * The client is injected so callers can control its lifetime and tests can
 * provide an isolated client. The application singleton remains the default.
 */
export class PrismaTranslationRepository
  implements ProjectRepository, TranslationRepository
{
  constructor(private readonly client: PrismaClient = prisma) {}

  async getProject(id: string): Promise<Project | null> {
    const project = await this.client.translationProject.findUnique({
      where: { id },
    });
    return project ? toProject(project) : null;
  }

  async listProjectsByTeam(teamId: string): Promise<Project[]> {
    const projects = await this.client.translationProject.findMany({
      where: { teamId },
      orderBy: { createdAt: 'asc' },
    });
    return projects.map(toProject);
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    try {
      const project = await this.client.translationProject.create({
        data: {
          teamId: input.teamId,
          name: input.name,
          sourceLocale: input.sourceLocale,
          locales: input.locales,
          localeFormat: localeFormatToPrisma(input.localeFormat ?? 'language'),
          billingScope: billingScopeToPrisma(input.billingScope ?? 'team'),
        },
      });
      return toProject(project);
    } catch (error) {
      if (!isPrismaErrorWithCode(error, 'P2002')) {
        throw error;
      }

      const existing = await this.client.translationProject.findUnique({
        where: {
          teamId_name: { teamId: input.teamId, name: input.name },
        },
      });
      if (!existing) {
        throw error;
      }
      if (
        existing.sourceLocale !== input.sourceLocale ||
        localeFormatFromPrisma(existing.localeFormat) !==
          (input.localeFormat ?? 'language') ||
        !this.haveSameLocales(existing.locales, input.locales)
      ) {
        throw error;
      }
      return toProject(existing);
    }
  }

  async updateProject(id: string, patch: UpdateProjectInput): Promise<Project> {
    const project = await this.client.translationProject.update({
      where: { id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.billingScope !== undefined
          ? { billingScope: billingScopeToPrisma(patch.billingScope) }
          : {}),
        ...(patch.billingId !== undefined
          ? { billingId: patch.billingId }
          : {}),
        ...(patch.billingProvider !== undefined
          ? { billingProvider: patch.billingProvider }
          : {}),
      },
    });
    return toProject(project);
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.translationProject.delete({ where: { id } });
  }

  async addLocale(projectId: string, locale: string): Promise<Project> {
    return this.runSerializable(async (transaction) => {
      const existing = await transaction.translationProject.findUnique({
        where: { id: projectId },
      });
      if (!existing) {
        throw new Error(`Project not found: ${projectId}`);
      }
      if (existing.locales.includes(locale)) {
        return toProject(existing);
      }

      const project = await transaction.translationProject.update({
        where: { id: projectId },
        data: { locales: { push: locale } },
      });
      return toProject(project);
    });
  }

  async removeLocale(projectId: string, locale: string): Promise<Project> {
    return this.runSerializable(async (transaction) => {
      const existing = await transaction.translationProject.findUnique({
        where: { id: projectId },
      });
      if (!existing) {
        throw new Error(`Project not found: ${projectId}`);
      }
      if (locale === existing.sourceLocale) {
        throw new Error('The source locale cannot be removed');
      }
      if (!existing.locales.includes(locale)) {
        return toProject(existing);
      }

      const project = await transaction.translationProject.update({
        where: { id: projectId },
        data: {
          locales: existing.locales.filter(
            (existingLocale) => existingLocale !== locale
          ),
        },
      });
      await transaction.translation.deleteMany({
        where: {
          locale,
          translationKey: { projectId },
        },
      });
      return toProject(project);
    });
  }

  async listKeys(projectId: string): Promise<TranslationKey[]> {
    const keys = await this.client.translationKey.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    return keys.map(toKey);
  }

  async getKey(id: string): Promise<TranslationKey | null> {
    const key = await this.client.translationKey.findUnique({ where: { id } });
    return key ? toKey(key) : null;
  }

  async findKeyByName(
    projectId: string,
    key: string
  ): Promise<TranslationKey | null> {
    const translationKey = await this.client.translationKey.findUnique({
      where: { projectId_key: { projectId, key } },
    });
    return translationKey ? toKey(translationKey) : null;
  }

  async createKey(input: Omit<TranslationKey, 'id'>): Promise<TranslationKey> {
    try {
      const key = await this.client.translationKey.create({ data: input });
      return toKey(key);
    } catch (error) {
      if (!isPrismaErrorWithCode(error, 'P2002')) {
        throw error;
      }

      const existing = await this.client.translationKey.findUnique({
        where: {
          projectId_key: { projectId: input.projectId, key: input.key },
        },
      });
      if (!existing) {
        throw error;
      }
      if (existing.sourceText !== input.sourceText) {
        throw error;
      }
      return toKey(existing);
    }
  }

  async updateKeySourceText(
    id: string,
    sourceText: string
  ): Promise<TranslationKey> {
    const key = await this.client.translationKey.update({
      where: { id },
      data: { sourceText },
    });
    return toKey(key);
  }

  async renameKey(id: string, key: string): Promise<TranslationKey> {
    const updated = await this.client.translationKey.update({
      where: { id },
      data: { key },
    });
    return toKey(updated);
  }

  async listTranslations(
    projectId: string,
    environmentId: string
  ): Promise<Translation[]> {
    const translations = await this.client.translation.findMany({
      where: { environmentId, translationKey: { projectId } },
      orderBy: { createdAt: 'asc' },
    });
    return translations.map(toTranslation);
  }

  async listTranslationsForKey(
    translationKeyId: string,
    environmentId: string
  ): Promise<Translation[]> {
    const translations = await this.client.translation.findMany({
      where: { translationKeyId, environmentId },
      orderBy: { createdAt: 'asc' },
    });
    return translations.map(toTranslation);
  }

  async findTranslation(
    translationKeyId: string,
    environmentId: string,
    locale: string
  ): Promise<Translation | null> {
    const translation = await this.client.translation.findUnique({
      where: {
        translationKeyId_environmentId_locale: {
          translationKeyId,
          environmentId,
          locale,
        },
      },
    });
    return translation ? toTranslation(translation) : null;
  }

  async getTranslation(id: string): Promise<Translation | null> {
    const translation = await this.client.translation.findUnique({
      where: { id },
    });
    return translation ? toTranslation(translation) : null;
  }

  async createTranslation(
    input: Omit<Translation, 'id' | 'updatedAt'>
  ): Promise<Translation> {
    const data = {
      translationKeyId: input.translationKeyId,
      environmentId: input.environmentId,
      locale: input.locale,
      value: input.value,
      source: sourceToPrisma[input.source],
      aiLocked: input.aiLocked,
      status: statusToPrisma[input.status],
    };

    try {
      const translation = await this.client.translation.create({ data });
      return toTranslation(translation);
    } catch (error) {
      if (!isPrismaErrorWithCode(error, 'P2002')) {
        throw error;
      }

      const existing = await this.client.translation.findUnique({
        where: {
          translationKeyId_environmentId_locale: {
            translationKeyId: input.translationKeyId,
            environmentId: input.environmentId,
            locale: input.locale,
          },
        },
      });
      if (!existing) {
        throw error;
      }
      if (input.aiLocked || input.source === 'manual') {
        return this.updateTranslation(existing.id, {
          value: input.value,
          source: input.source,
          aiLocked: input.aiLocked,
          status: input.status,
        });
      }
      return toTranslation(existing);
    }
  }

  async updateTranslation(
    id: string,
    patch: Partial<
      Pick<Translation, 'value' | 'source' | 'aiLocked' | 'status'>
    >
  ): Promise<Translation> {
    const data: Prisma.TranslationUpdateManyMutationInput = {};
    if (patch.value !== undefined) {
      data.value = patch.value;
    }
    if (patch.source !== undefined) {
      data.source = sourceToPrisma[patch.source];
    }
    if (patch.aiLocked !== undefined) {
      data.aiLocked = patch.aiLocked;
    }
    if (patch.status !== undefined) {
      data.status = statusToPrisma[patch.status];
    }

    if (patch.source === 'ai' || patch.source === 'code') {
      const result = await this.client.translation.updateMany({
        where: {
          id,
          aiLocked: false,
          source: { not: PrismaTranslationSource.MANUAL },
        },
        data,
      });
      if (result.count === 0) {
        const preserved = await this.client.translation.findUnique({
          where: { id },
        });
        if (!preserved) {
          throw new Error(`Translation not found: ${id}`);
        }
        return toTranslation(preserved);
      }

      const updated = await this.client.translation.findUnique({
        where: { id },
      });
      if (!updated) {
        throw new Error(`Translation not found after update: ${id}`);
      }
      return toTranslation(updated);
    }

    const updated = await this.client.translation.update({
      where: { id },
      data,
    });
    return toTranslation(updated);
  }

  private haveSameLocales(left: string[], right: string[]): boolean {
    return (
      left.length === right.length &&
      left.every((locale) => right.includes(locale))
    );
  }

  private async runSerializable<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.client.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (
          !isPrismaErrorWithCode(error, 'P2034') ||
          attempt === MAX_TRANSACTION_ATTEMPTS
        ) {
          throw error;
        }
      }
    }

    throw new Error('Serializable transaction retry limit exceeded');
  }
}
