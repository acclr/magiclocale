export type SourceKey = {
  key: string;
  sourceText?: string;
  type?: 'translation' | 'feature-flag';
  usage?: {
    file?: string;
    line?: number;
    column?: number | null;
    repository?: string | null;
    branch?: string | null;
  };
};

export type TranslationBundle = {
  projectId: string;
  locale: string;
  sourceLocale: string;
  translations: Record<string, string>;
  version: string;
  environment?: string;
  versionNumber?: number | null;
  publishedAt?: string | null;
};

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

export type FlagValue =
  | boolean
  | string
  | number
  | null
  | FlagValue[]
  | { [key: string]: FlagValue };

export type FlagRuleSnapshot = {
  attribute: string;
  operator: FlagRuleOperator;
  values: string[];
  value: FlagValue;
  rolloutPercentage: number | null;
};

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

export type FlagPayload = {
  projectId: string;
  environment: string;
  version: string;
  versionNumber: number | null;
  flags: FlagSnapshot[];
};

export type FlagEvaluationContext = {
  key?: string | null;
  attributes?: Record<string, string | number | boolean | null | undefined>;
};

export type FetchLike = (
  input: string | URL,
  init?: RequestInit
) => Promise<Response>;

export type LocaleKitConfig = {
  baseUrl: string;
  projectId: string;
  ingestToken: string;
  sourceLocale?: string;
  locale?: string;
  environment?: string;
  version?: number;
  context?: FlagEvaluationContext;
  initialBundle?: TranslationBundle;
  initialFlags?: FlagPayload;
  refreshIntervalMs?: number;
  debounceMs?: number;
  batchSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  fetch?: FetchLike;
  onError?: (error: Error) => void;
};

export type ResolvedLocaleKitConfig = Required<
  Omit<
    LocaleKitConfig,
    | 'fetch'
    | 'onError'
    | 'initialBundle'
    | 'initialFlags'
    | 'environment'
    | 'version'
    | 'context'
  >
> & {
  fetch: FetchLike;
  onError: (error: Error) => void;
  environment: string;
  version: number | null;
  context: FlagEvaluationContext;
  initialBundle?: TranslationBundle;
  initialFlags?: FlagPayload;
};
