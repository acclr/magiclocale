import { z } from 'zod';

export const keyTypeSchema = z.enum(['translation', 'feature-flag']);

export const keyLifecycleSchema = z.enum([
  'active',
  'unused',
  'deprecated',
  'archived',
]);

export const keyCatalogQuerySchema = z.object({
  projectId: z.string().uuid(),
  search: z.string().trim().max(200).optional(),
  type: z.enum(['translation', 'feature-flag', 'all']).optional(),
  lifecycle: z
    .enum(['active', 'unused', 'deprecated', 'archived', 'all'])
    .optional(),
  namespace: z.string().trim().max(200).optional(),
  owner: z.string().trim().max(120).optional(),
  usage: z.coerce.number().int().min(0).optional(),
  file: z.string().trim().max(500).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const updateKeyMetaSchema = z.object({
  description: z.string().trim().max(2000).nullable().optional(),
  developerNote: z.string().trim().max(2000).nullable().optional(),
  owner: z.string().trim().max(120).nullable().optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  lifecycle: keyLifecycleSchema.optional(),
  replacementKey: z.string().trim().max(200).nullable().optional(),
  reviewAt: z.string().datetime().nullable().optional(),
});

export const restoreKeyChangeSchema = z.object({
  changeId: z.string().uuid(),
});

export const compareEnvironmentsSchema = z.object({
  left: z.string().trim().min(1),
  right: z.string().trim().min(1),
});

export const promoteFlagSchema = z.object({
  sourceEnvironment: z.string().trim().min(1),
  targetEnvironment: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
});

export const architectureRuleSchema = z.object({
  allowedRootNamespaces: z
    .array(z.string().trim().min(1).max(40))
    .max(50)
    .optional(),
  maxDepth: z.number().int().min(1).max(10).optional(),
  minDepth: z.number().int().min(0).max(5).optional(),
  requiredOwner: z.boolean().optional(),
  requiredDescription: z.boolean().optional(),
  forbiddenPrefixes: z
    .array(z.string().trim().min(1).max(40))
    .max(20)
    .optional(),
  temporaryFlagReviewRequired: z.boolean().optional(),
  staleEnabledDays: z.number().int().min(1).max(730).optional(),
});

export const findingStatusSchema = z.enum([
  'open',
  'reviewed',
  'ignored',
  'intentional',
]);

export const updateFindingSchema = z.object({
  status: findingStatusSchema,
});

export const findingActionSchema = z.object({
  action: z.enum(['cleanup']),
});

export const createMigrationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  operations: z
    .array(
      z.object({
        type: z.enum([
          'rename-key',
          'move-key',
          'merge-translations',
          'deprecate-key',
          'archive-key',
          'delete-key',
          'assign-owner',
        ]),
        keyType: keyTypeSchema,
        fromKey: z.string().trim().min(1).max(200),
        toKey: z.string().trim().min(1).max(200).optional(),
        payload: z.record(z.unknown()).optional(),
      })
    )
    .min(1)
    .max(200),
});
