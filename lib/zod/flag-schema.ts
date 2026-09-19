import { z } from 'zod';

import { environmentRefSchema } from './environment-schema';

export const flagTypeSchema = z.enum(['boolean', 'string', 'number', 'json']);

export const flagVisibilitySchema = z.enum(['public', 'server-only']);

export const flagRuleOperatorSchema = z.enum([
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
]);

export const flagKeySchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(64)
  .regex(
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/,
    'Use lowercase letters, numbers, dots, dashes, and underscores'
  );

/**
 * Flag values are arbitrary JSON for `json` flags, so the schema stays
 * permissive here and the domain coerces to the flag's declared type.
 */
export const flagValueSchema: z.ZodType<unknown> = z.any();

export const rolloutPercentageSchema = z
  .number()
  .int()
  .min(0)
  .max(100)
  .nullable();

export const createFlagSchema = z.object({
  key: flagKeySchema,
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  type: flagTypeSchema.optional(),
  visibility: flagVisibilitySchema.optional(),
});

export const updateFlagSchema = z.object({
  flagId: z.string().uuid(),
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  visibility: flagVisibilitySchema.optional(),
  archived: z.boolean().optional(),
});

export const deleteFlagSchema = z.object({
  flagId: z.string().uuid(),
});

export const flagConfigSchema = z.object({
  flagId: z.string().uuid(),
  environment: environmentRefSchema.optional(),
  enabled: z.boolean().optional(),
  defaultValue: flagValueSchema.optional(),
  offValue: flagValueSchema.optional(),
  rolloutPercentage: rolloutPercentageSchema.optional(),
  inherited: z.boolean().optional(),
  reason: z.string().trim().max(500).optional(),
});

export const flagRuleSchema = z.object({
  description: z.string().trim().max(200).optional(),
  attribute: z.string().trim().min(1).max(60),
  operator: flagRuleOperatorSchema,
  values: z.array(z.string().trim().max(200)).min(1).max(100),
  value: flagValueSchema,
  rolloutPercentage: rolloutPercentageSchema.optional(),
});

export const flagRulesSchema = z.object({
  flagId: z.string().uuid(),
  environment: environmentRefSchema.optional(),
  rules: z.array(flagRuleSchema).max(50),
  reason: z.string().trim().max(500).optional(),
});

export const flagListQuerySchema = z.object({
  projectId: z.string().uuid(),
  environment: environmentRefSchema.optional(),
});

export const flagEvaluationContextSchema = z.object({
  key: z.string().trim().max(200).nullable().optional(),
  attributes: z
    .record(
      z.union([z.string(), z.number(), z.boolean(), z.null()])
    )
    .optional(),
});

export const evaluateFlagsSchema = z.object({
  environment: environmentRefSchema.optional(),
  keys: z.array(flagKeySchema).max(200).optional(),
  context: flagEvaluationContextSchema.optional(),
});
