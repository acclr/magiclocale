export type FlagType = 'boolean' | 'string' | 'number' | 'json';

export type FlagVisibility = 'public' | 'server-only';

export type FlagRuleOperator =
  | 'equals'
  | 'not-equals'
  | 'in'
  | 'not-in'
  | 'contains'
  | 'not-contains'
  | 'starts-with'
  | 'ends-with'
  | 'greater-than'
  | 'less-than';

export const FLAG_TYPES: FlagType[] = ['boolean', 'string', 'number', 'json'];

export const FLAG_RULE_OPERATORS: FlagRuleOperator[] = [
  'equals',
  'not-equals',
  'in',
  'not-in',
  'contains',
  'not-contains',
  'starts-with',
  'ends-with',
  'greater-than',
  'less-than',
];

/** Any value a flag can serve. `json` flags may hold arbitrary JSON. */
export type FlagValue =
  | boolean
  | string
  | number
  | null
  | FlagValue[]
  | { [key: string]: FlagValue };

/** Flag definition, shared by every environment in the project. */
export type FeatureFlag = {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  type: FlagType;
  visibility: FlagVisibility;
  archived: boolean;
};

export type FlagRule = {
  id: string;
  configId: string;
  order: number;
  description: string | null;
  attribute: string;
  operator: FlagRuleOperator;
  values: string[];
  value: FlagValue;
  rolloutPercentage: number | null;
};

/** Per-environment behaviour for one flag. */
export type FlagEnvironmentConfig = {
  id: string;
  flagId: string;
  environmentId: string;
  enabled: boolean;
  defaultValue: FlagValue;
  offValue: FlagValue;
  rolloutPercentage: number | null;
  rolloutSalt: string;
  rules: FlagRule[];
};

/** A flag plus its configuration in one environment. */
export type FlagWithConfig = {
  flag: FeatureFlag;
  config: FlagEnvironmentConfig;
};

export type CreateFlagInput = {
  projectId: string;
  key: string;
  name: string;
  description?: string | null;
  type?: FlagType;
  visibility?: FlagVisibility;
};

export type UpdateFlagInput = {
  name?: string;
  description?: string | null;
  visibility?: FlagVisibility;
  archived?: boolean;
};

export type UpsertFlagConfigInput = {
  enabled?: boolean;
  defaultValue?: FlagValue;
  offValue?: FlagValue;
  rolloutPercentage?: number | null;
};

export type FlagRuleInput = {
  description?: string | null;
  attribute: string;
  operator: FlagRuleOperator;
  values: string[];
  value: FlagValue;
  rolloutPercentage?: number | null;
};

/* ---------- Snapshot / wire shapes ---------- */

export type FlagRuleSnapshot = {
  attribute: string;
  operator: FlagRuleOperator;
  values: string[];
  value: FlagValue;
  rolloutPercentage: number | null;
};

/**
 * The serialized form of one flag for a single environment. This is what
 * gets frozen into a published version and what the SDK evaluates locally.
 */
export type FlagSnapshot = {
  key: string;
  type: FlagType;
  visibility: FlagVisibility;
  enabled: boolean;
  defaultValue: FlagValue;
  offValue: FlagValue;
  rolloutPercentage: number | null;
  rolloutSalt: string;
  rules: FlagRuleSnapshot[];
};

export type FlagSetSnapshot = {
  flags: FlagSnapshot[];
};

export const EMPTY_FLAG_SET: FlagSetSnapshot = { flags: [] };

/** Attributes a caller supplies when evaluating flags. */
export type FlagEvaluationContext = {
  /** Stable identifier used for percentage bucketing. */
  key?: string | null;
  attributes?: Record<string, string | number | boolean | null | undefined>;
};

export type FlagEvaluationReason =
  | 'flag-not-found'
  | 'disabled'
  | 'rule-match'
  | 'rule-rollout-excluded'
  | 'rollout-included'
  | 'rollout-excluded'
  | 'default';

export type FlagEvaluation = {
  key: string;
  value: FlagValue;
  reason: FlagEvaluationReason;
  /** Index of the matched targeting rule, when `reason` is rule based. */
  ruleIndex: number | null;
};

export function defaultValueForType(type: FlagType): FlagValue {
  switch (type) {
    case 'boolean':
      return true;
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'json':
      return {};
  }
}

export function offValueForType(type: FlagType): FlagValue {
  switch (type) {
    case 'boolean':
      return false;
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'json':
      return null;
  }
}
