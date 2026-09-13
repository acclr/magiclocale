import type { EnvironmentService } from '../environments/environment-service';
import type { Environment } from '../environments/types';
import type { ProjectService } from '../translations/project-service';
import type { FlagChangeRecorder } from './change-recorder';
import { noopFlagChangeRecorder } from './change-recorder';
import type { FlagRepository } from './repository';
import {
  defaultValueForType,
  offValueForType,
  type CreateFlagInput,
  type FeatureFlag,
  type FlagEnvironmentConfig,
  type FlagRuleInput,
  type FlagSetSnapshot,
  type FlagSnapshot,
  type FlagType,
  type FlagWithConfig,
  type UpdateFlagInput,
  type UpsertFlagConfigInput,
} from './types';

const KEY_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

export class FlagLimitError extends Error {
  constructor(readonly limit: number) {
    super(`This plan includes up to ${limit} feature flags.`);
    this.name = 'FlagLimitError';
  }
}

/**
 * Owns the flag catalog (project-wide) and its per-environment configuration.
 * Enabling a flag in staging never touches production, because behaviour is
 * stored per environment while the definition is shared.
 */
export class FlagService {
  constructor(
    private readonly repository: FlagRepository,
    private readonly projectService: ProjectService,
    private readonly environmentService: EnvironmentService,
    private readonly changeRecorder: FlagChangeRecorder = noopFlagChangeRecorder
  ) {}

  async list(
    teamId: string,
    projectId: string,
    environmentRef?: string | null
  ): Promise<{ environment: Environment; flags: FlagWithConfig[] }> {
    const { project, environment } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    const flags = await this.repository.listFlags(project.id);
    const withConfig: FlagWithConfig[] = [];

    for (const flag of flags) {
      withConfig.push({
        flag,
        config: await this.ensureConfig(flag, environment.id),
      });
    }

    return { environment, flags: withConfig };
  }

  async get(
    teamId: string,
    projectId: string,
    flagId: string,
    environmentRef?: string | null
  ): Promise<{ environment: Environment; flag: FlagWithConfig }> {
    const { project, environment } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    const flag = await this.requireProjectFlag(project.id, flagId);
    return {
      environment,
      flag: { flag, config: await this.ensureConfig(flag, environment.id) },
    };
  }

  async create(
    teamId: string,
    projectId: string,
    input: Omit<CreateFlagInput, 'projectId'>,
    options?: { maxFlags?: number | null }
  ): Promise<FeatureFlag> {
    const project = await this.projectService.get(teamId, projectId);
    const key = this.requireKey(input.key);
    const existing = await this.repository.findFlagByKey(project.id, key);
    if (existing) {
      throw new Error(`Feature flag already exists: ${key}`);
    }
    if (options?.maxFlags !== undefined && options.maxFlags !== null) {
      const count = await this.repository.countFlags(project.id);
      if (count >= options.maxFlags) {
        throw new FlagLimitError(options.maxFlags);
      }
    }

    const flag = await this.repository.createFlag({
      projectId: project.id,
      key,
      name: input.name?.trim() || key,
      description: input.description?.trim() || null,
      type: input.type ?? 'boolean',
      visibility: input.visibility ?? 'public',
    });

    // Give every environment a configuration up front so the flag shows up
    // consistently everywhere, defaulted to off.
    const environments = await this.environmentService.listForProject(
      project.id
    );
    for (const environment of environments) {
      await this.ensureConfig(flag, environment.id);
    }

    return flag;
  }

  async update(
    teamId: string,
    projectId: string,
    flagId: string,
    patch: UpdateFlagInput
  ): Promise<FeatureFlag> {
    const project = await this.projectService.get(teamId, projectId);
    const flag = await this.requireProjectFlag(project.id, flagId);
    return this.repository.updateFlag(flag.id, {
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description?.trim() || null }
        : {}),
      ...(patch.visibility !== undefined
        ? { visibility: patch.visibility }
        : {}),
      ...(patch.archived !== undefined ? { archived: patch.archived } : {}),
    });
  }

  async delete(
    teamId: string,
    projectId: string,
    flagId: string
  ): Promise<void> {
    const project = await this.projectService.get(teamId, projectId);
    const flag = await this.requireProjectFlag(project.id, flagId);
    await this.repository.deleteFlag(flag.id);
  }

  async setConfig(
    teamId: string,
    projectId: string,
    flagId: string,
    environmentRef: string | null | undefined,
    patch: UpsertFlagConfigInput,
    actor?: string | null
  ): Promise<FlagWithConfig> {
    const { project, environment } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    const flag = await this.requireProjectFlag(project.id, flagId);
    const config = await this.ensureConfig(flag, environment.id);

    if (
      patch.rolloutPercentage !== undefined &&
      patch.rolloutPercentage !== null
    ) {
      this.requirePercentage(patch.rolloutPercentage);
    }

    const updated = await this.repository.updateConfig(config.id, patch);
    await this.record(flag, config, updated, actor);
    return { flag, config: updated };
  }

  async setRules(
    teamId: string,
    projectId: string,
    flagId: string,
    environmentRef: string | null | undefined,
    rules: FlagRuleInput[],
    actor?: string | null
  ): Promise<FlagWithConfig> {
    const { project, environment } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    const flag = await this.requireProjectFlag(project.id, flagId);
    const config = await this.ensureConfig(flag, environment.id);

    const normalized = rules.map((rule) => {
      const attribute = rule.attribute.trim();
      if (!attribute) {
        throw new Error('A targeting rule needs an attribute');
      }
      const values = rule.values
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      if (!values.length) {
        throw new Error(
          `A targeting rule on "${attribute}" needs at least one value`
        );
      }
      if (
        rule.rolloutPercentage !== undefined &&
        rule.rolloutPercentage !== null
      ) {
        this.requirePercentage(rule.rolloutPercentage);
      }

      return {
        description: rule.description?.trim() || null,
        attribute,
        operator: rule.operator,
        values,
        value: rule.value,
        rolloutPercentage: rule.rolloutPercentage ?? null,
      };
    });

    const updated = await this.repository.replaceRules(config.id, normalized);
    await this.record(flag, config, updated, actor);
    return { flag, config: updated };
  }

  /**
   * Serialize every non-archived flag for one environment. Used both to seal
   * a published version and to answer the SDK's flag payload request.
   */
  async buildSnapshot(environmentId: string): Promise<FlagSetSnapshot> {
    const configs =
      await this.repository.listConfigsForEnvironment(environmentId);
    const flags: FlagSnapshot[] = [];

    for (const config of configs) {
      const flag = await this.repository.getFlag(config.flagId);
      if (!flag || flag.archived) {
        continue;
      }
      flags.push(toFlagSnapshot(flag, config));
    }

    flags.sort((left, right) => left.key.localeCompare(right.key));
    return { flags };
  }

  async ensureConfig(
    flag: FeatureFlag,
    environmentId: string
  ): Promise<FlagEnvironmentConfig> {
    const existing = await this.repository.getConfig(flag.id, environmentId);
    if (existing) {
      return existing;
    }

    return this.repository.createConfig({
      flagId: flag.id,
      environmentId,
      enabled: false,
      defaultValue: defaultValueForType(flag.type),
      offValue: offValueForType(flag.type),
      rolloutSalt: randomSalt(),
    });
  }

  async requireProjectFlag(
    projectId: string,
    flagId: string
  ): Promise<FeatureFlag> {
    const flag = await this.repository.getFlag(flagId);
    if (!flag || flag.projectId !== projectId) {
      throw new Error(`Feature flag not found: ${flagId}`);
    }
    return flag;
  }

  async countForProject(projectId: string): Promise<number> {
    return this.repository.countFlags(projectId);
  }

  /** Seed default (off) configs so existing flags appear in a new environment. */
  async provisionEnvironment(
    projectId: string,
    environmentId: string
  ): Promise<void> {
    const flags = await this.repository.listFlags(projectId);
    for (const flag of flags) {
      await this.ensureConfig(flag, environmentId);
    }
  }

  private async requireScope(
    teamId: string,
    projectId: string,
    environmentRef?: string | null
  ) {
    const project = await this.projectService.get(teamId, projectId);
    const environment = await this.environmentService.resolve(
      project.id,
      environmentRef
    );
    return { project, environment };
  }

  private async record(
    flag: FeatureFlag,
    before: FlagEnvironmentConfig,
    after: FlagEnvironmentConfig,
    actor?: string | null
  ): Promise<void> {
    try {
      await this.changeRecorder.recordFlagChange({
        environmentId: after.environmentId,
        key: flag.key,
        before: toFlagSnapshot(flag, before),
        after: toFlagSnapshot(flag, after),
        actor: actor ?? null,
      });
    } catch (error) {
      console.error('Unable to record feature flag change.', error);
    }
  }

  private requireKey(key: string): string {
    const normalized = key.trim().toLowerCase();
    if (!normalized) {
      throw new Error('Feature flag key is required');
    }
    if (!KEY_PATTERN.test(normalized)) {
      throw new Error(
        'Feature flag keys may only contain lowercase letters, numbers, ' +
          'dots, dashes, and underscores'
      );
    }
    return normalized;
  }

  private requirePercentage(percentage: number): void {
    if (
      !Number.isInteger(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      throw new Error('A rollout percentage must be between 0 and 100');
    }
  }
}

export function toFlagSnapshot(
  flag: FeatureFlag,
  config: FlagEnvironmentConfig
): FlagSnapshot {
  return {
    key: flag.key,
    type: flag.type,
    visibility: flag.visibility,
    enabled: config.enabled,
    defaultValue: config.defaultValue,
    offValue: config.offValue,
    rolloutPercentage: config.rolloutPercentage,
    rolloutSalt: config.rolloutSalt,
    rules: [...config.rules]
      .sort((left, right) => left.order - right.order)
      .map((rule) => ({
        attribute: rule.attribute,
        operator: rule.operator,
        values: rule.values,
        value: rule.value,
        rolloutPercentage: rule.rolloutPercentage,
      })),
  };
}

/** Stable per-flag bucketing seed, so changing a percentage does not reshuffle. */
function randomSalt(): string {
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

export function flagTypeFromInput(value: unknown): FlagType {
  return value === 'string' || value === 'number' || value === 'json'
    ? value
    : 'boolean';
}
