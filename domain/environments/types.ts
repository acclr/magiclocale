export type EnvironmentId = string;

export type Environment = {
  id: EnvironmentId;
  projectId: string;
  slug: string;
  name: string;
  isProduction: boolean;
  liveVersionId: string | null;
  parentEnvironmentId: string | null;
};

export type CreateEnvironmentInput = {
  projectId: string;
  slug: string;
  name: string;
  isProduction?: boolean;
  parentEnvironmentId?: string | null;
};

export type UpdateEnvironmentInput = {
  name?: string;
  liveVersionId?: string | null;
  parentEnvironmentId?: string | null;
};

/**
 * Hard product cap. A project starts with production only and may add two
 * more. Independent of billing plan, which may cap lower.
 */
export const MAX_ENVIRONMENTS_PER_PROJECT = 3;

export const PRODUCTION_ENVIRONMENT_SLUG = 'production';

export const DEFAULT_ENVIRONMENT_SLUGS = [
  'production',
  'staging',
  'development',
] as const;
