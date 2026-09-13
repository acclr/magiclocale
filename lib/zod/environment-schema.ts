import { z } from 'zod';

/** Accepts an environment slug or id; empty means "the default environment". */
export const environmentRefSchema = z.string().trim().min(1).max(64);

export const environmentQuerySchema = z.object({
  environment: environmentRefSchema.optional(),
});

export const environmentSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(32)
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    'Use lowercase letters, numbers, and dashes'
  );

export const createEnvironmentSchema = z.object({
  slug: environmentSlugSchema,
  name: z.string().trim().min(1).max(60).optional(),
});

export const updateEnvironmentSchema = z.object({
  environmentId: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
});

export const deleteEnvironmentSchema = z.object({
  environmentId: z.string().uuid(),
});

export const publishVersionSchema = z.object({
  environment: environmentRefSchema.optional(),
  message: z.string().trim().max(500).optional(),
});

export const rollbackVersionSchema = z.object({
  environment: environmentRefSchema.optional(),
  versionId: z.string().uuid(),
});

export const promoteVersionSchema = z.object({
  /** Environment the sealed version is taken from. */
  sourceEnvironment: environmentRefSchema,
  /** Environment receiving the merge. */
  targetEnvironment: environmentRefSchema,
  versionId: z.string().uuid().optional(),
  /** When false, returns the plan without writing anything. */
  apply: z.boolean().optional(),
});

export const versionHistoryQuerySchema = z.object({
  projectId: z.string().uuid(),
  environment: environmentRefSchema.optional(),
  versionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
