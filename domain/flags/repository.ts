import type {
  CreateFlagInput,
  FeatureFlag,
  FlagEnvironmentConfig,
  FlagRuleInput,
  FlagValue,
  UpdateFlagInput,
  UpsertFlagConfigInput,
} from './types';

export type CreateFlagConfigInput = {
  flagId: string;
  environmentId: string;
  enabled: boolean;
  defaultValue: FlagValue;
  offValue: FlagValue;
  rolloutSalt: string;
};

export interface FlagRepository {
  listFlags(projectId: string): Promise<FeatureFlag[]>;
  getFlag(id: string): Promise<FeatureFlag | null>;
  findFlagByKey(projectId: string, key: string): Promise<FeatureFlag | null>;
  countFlags(projectId: string): Promise<number>;
  createFlag(input: CreateFlagInput): Promise<FeatureFlag>;
  updateFlag(id: string, patch: UpdateFlagInput): Promise<FeatureFlag>;
  renameFlag(id: string, key: string): Promise<FeatureFlag>;
  deleteFlag(id: string): Promise<void>;

  getConfig(
    flagId: string,
    environmentId: string
  ): Promise<FlagEnvironmentConfig | null>;
  listConfigsForEnvironment(
    environmentId: string
  ): Promise<FlagEnvironmentConfig[]>;
  createConfig(input: CreateFlagConfigInput): Promise<FlagEnvironmentConfig>;
  updateConfig(
    id: string,
    patch: UpsertFlagConfigInput
  ): Promise<FlagEnvironmentConfig>;
  copyConfig(
    sourceConfigId: string,
    targetConfigId: string,
    inherited: boolean
  ): Promise<FlagEnvironmentConfig>;

  /** Replaces the full ordered rule list for a config in one transaction. */
  replaceRules(
    configId: string,
    rules: FlagRuleInput[]
  ): Promise<FlagEnvironmentConfig>;
}
