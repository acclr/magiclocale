import {
  Prisma,
  PrismaClient,
  FlagRuleOperator as PrismaFlagRuleOperator,
  FlagType as PrismaFlagType,
  FlagVisibility as PrismaFlagVisibility,
  type FeatureFlag as PrismaFeatureFlag,
  type FlagEnvironmentConfig as PrismaFlagConfig,
  type FlagRule as PrismaFlagRule,
} from '@prisma/client';

import type {
  CreateFlagConfigInput,
  FlagRepository,
} from '../../domain/flags/repository';
import type {
  CreateFlagInput,
  FeatureFlag,
  FlagEnvironmentConfig,
  FlagRule,
  FlagRuleInput,
  FlagRuleOperator,
  FlagType,
  FlagValue,
  FlagVisibility,
  UpdateFlagInput,
  UpsertFlagConfigInput,
} from '../../domain/flags/types';
import { prisma } from '../../lib/prisma';

const typeToPrisma: Record<FlagType, PrismaFlagType> = {
  boolean: PrismaFlagType.BOOLEAN,
  string: PrismaFlagType.STRING,
  number: PrismaFlagType.NUMBER,
  json: PrismaFlagType.JSON,
};

const typeFromPrisma: Record<PrismaFlagType, FlagType> = {
  BOOLEAN: 'boolean',
  STRING: 'string',
  NUMBER: 'number',
  JSON: 'json',
};

const visibilityToPrisma: Record<FlagVisibility, PrismaFlagVisibility> = {
  public: PrismaFlagVisibility.PUBLIC,
  'server-only': PrismaFlagVisibility.SERVER_ONLY,
};

const visibilityFromPrisma: Record<PrismaFlagVisibility, FlagVisibility> = {
  PUBLIC: 'public',
  SERVER_ONLY: 'server-only',
};

const operatorToPrisma: Record<FlagRuleOperator, PrismaFlagRuleOperator> = {
  equals: PrismaFlagRuleOperator.EQUALS,
  'not-equals': PrismaFlagRuleOperator.NOT_EQUALS,
  in: PrismaFlagRuleOperator.IN,
  'not-in': PrismaFlagRuleOperator.NOT_IN,
  contains: PrismaFlagRuleOperator.CONTAINS,
  'not-contains': PrismaFlagRuleOperator.NOT_CONTAINS,
  'starts-with': PrismaFlagRuleOperator.STARTS_WITH,
  'ends-with': PrismaFlagRuleOperator.ENDS_WITH,
  'greater-than': PrismaFlagRuleOperator.GREATER_THAN,
  'less-than': PrismaFlagRuleOperator.LESS_THAN,
};

const operatorFromPrisma: Record<PrismaFlagRuleOperator, FlagRuleOperator> = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not-equals',
  IN: 'in',
  NOT_IN: 'not-in',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not-contains',
  STARTS_WITH: 'starts-with',
  ENDS_WITH: 'ends-with',
  GREATER_THAN: 'greater-than',
  LESS_THAN: 'less-than',
};

function toFlag(flag: PrismaFeatureFlag): FeatureFlag {
  return {
    id: flag.id,
    projectId: flag.projectId,
    key: flag.key,
    name: flag.name,
    description: flag.description,
    type: typeFromPrisma[flag.type],
    visibility: visibilityFromPrisma[flag.visibility],
    archived: flag.archived,
  };
}

function toRule(rule: PrismaFlagRule): FlagRule {
  return {
    id: rule.id,
    configId: rule.configId,
    order: rule.order,
    description: rule.description,
    attribute: rule.attribute,
    operator: operatorFromPrisma[rule.operator],
    values: rule.values,
    value: rule.value as FlagValue,
    rolloutPercentage: rule.rolloutPercentage,
  };
}

function toConfig(
  config: PrismaFlagConfig & { rules?: PrismaFlagRule[] }
): FlagEnvironmentConfig {
  return {
    id: config.id,
    flagId: config.flagId,
    environmentId: config.environmentId,
    enabled: config.enabled,
    defaultValue: config.defaultValue as FlagValue,
    offValue: config.offValue as FlagValue,
    rolloutPercentage: config.rolloutPercentage,
    rolloutSalt: config.rolloutSalt,
    rules: (config.rules ?? [])
      .slice()
      .sort((left, right) => left.order - right.order)
      .map(toRule),
  };
}

function asJson(value: FlagValue): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

export class PrismaFlagRepository implements FlagRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async listFlags(projectId: string): Promise<FeatureFlag[]> {
    const flags = await this.client.featureFlag.findMany({
      where: { projectId },
      orderBy: { key: 'asc' },
    });
    return flags.map(toFlag);
  }

  async getFlag(id: string): Promise<FeatureFlag | null> {
    const flag = await this.client.featureFlag.findUnique({ where: { id } });
    return flag ? toFlag(flag) : null;
  }

  async findFlagByKey(
    projectId: string,
    key: string
  ): Promise<FeatureFlag | null> {
    const flag = await this.client.featureFlag.findUnique({
      where: { projectId_key: { projectId, key } },
    });
    return flag ? toFlag(flag) : null;
  }

  async countFlags(projectId: string): Promise<number> {
    return this.client.featureFlag.count({
      where: { projectId, archived: false },
    });
  }

  async createFlag(input: CreateFlagInput): Promise<FeatureFlag> {
    const flag = await this.client.featureFlag.create({
      data: {
        projectId: input.projectId,
        key: input.key,
        name: input.name,
        description: input.description ?? null,
        type: typeToPrisma[input.type ?? 'boolean'],
        visibility: visibilityToPrisma[input.visibility ?? 'public'],
      },
    });
    return toFlag(flag);
  }

  async updateFlag(id: string, patch: UpdateFlagInput): Promise<FeatureFlag> {
    const flag = await this.client.featureFlag.update({
      where: { id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
        ...(patch.visibility !== undefined
          ? { visibility: visibilityToPrisma[patch.visibility] }
          : {}),
        ...(patch.archived !== undefined ? { archived: patch.archived } : {}),
      },
    });
    return toFlag(flag);
  }

  async deleteFlag(id: string): Promise<void> {
    await this.client.featureFlag.delete({ where: { id } });
  }

  async getConfig(
    flagId: string,
    environmentId: string
  ): Promise<FlagEnvironmentConfig | null> {
    const config = await this.client.flagEnvironmentConfig.findUnique({
      where: { flagId_environmentId: { flagId, environmentId } },
      include: { rules: true },
    });
    return config ? toConfig(config) : null;
  }

  async listConfigsForEnvironment(
    environmentId: string
  ): Promise<FlagEnvironmentConfig[]> {
    const configs = await this.client.flagEnvironmentConfig.findMany({
      where: { environmentId },
      include: { rules: true },
    });
    return configs.map(toConfig);
  }

  async createConfig(
    input: CreateFlagConfigInput
  ): Promise<FlagEnvironmentConfig> {
    try {
      const config = await this.client.flagEnvironmentConfig.create({
        data: {
          flagId: input.flagId,
          environmentId: input.environmentId,
          enabled: input.enabled,
          defaultValue: asJson(input.defaultValue),
          offValue: asJson(input.offValue),
          rolloutSalt: input.rolloutSalt,
        },
        include: { rules: true },
      });
      return toConfig(config);
    } catch (error) {
      // Lazy config creation races when two requests touch a new flag at once.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      ) {
        throw error;
      }
      const existing = await this.getConfig(
        input.flagId,
        input.environmentId
      );
      if (!existing) {
        throw error;
      }
      return existing;
    }
  }

  async updateConfig(
    id: string,
    patch: UpsertFlagConfigInput
  ): Promise<FlagEnvironmentConfig> {
    const config = await this.client.flagEnvironmentConfig.update({
      where: { id },
      data: {
        ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
        ...(patch.defaultValue !== undefined
          ? { defaultValue: asJson(patch.defaultValue) }
          : {}),
        ...(patch.offValue !== undefined
          ? { offValue: asJson(patch.offValue) }
          : {}),
        ...(patch.rolloutPercentage !== undefined
          ? { rolloutPercentage: patch.rolloutPercentage }
          : {}),
      },
      include: { rules: true },
    });
    return toConfig(config);
  }

  async replaceRules(
    configId: string,
    rules: FlagRuleInput[]
  ): Promise<FlagEnvironmentConfig> {
    return this.client.$transaction(async (transaction) => {
      await transaction.flagRule.deleteMany({ where: { configId } });

      for (let index = 0; index < rules.length; index += 1) {
        const rule = rules[index];
        await transaction.flagRule.create({
          data: {
            configId,
            order: index,
            description: rule.description ?? null,
            attribute: rule.attribute,
            operator: operatorToPrisma[rule.operator],
            values: rule.values,
            value: asJson(rule.value),
            rolloutPercentage: rule.rolloutPercentage ?? null,
          },
        });
      }

      const config = await transaction.flagEnvironmentConfig.findUnique({
        where: { id: configId },
        include: { rules: true },
      });
      if (!config) {
        throw new Error(`Feature flag config not found: ${configId}`);
      }
      return toConfig(config);
    });
  }
}
