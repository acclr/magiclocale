import { z } from 'zod';

const projectId = z.string().uuid();
const keyId = z.string().uuid();
const translationId = z.string().uuid();
const locale = z
  .string()
  .trim()
  .min(2)
  .max(35)
  .regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/, 'Invalid locale');
const translationValue = z.string().max(10_000);

export const translationProjectParamsSchema = z.object({ projectId });

export const createTranslationProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sourceLocale: locale,
  locales: z.array(locale).max(50).optional(),
  billingScope: z.enum(['team', 'project']).optional(),
});

export const renameTranslationProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const projectBillingScopeSchema = z.object({
  billingScope: z.enum(['team', 'project']),
});

export const translationCellSchema = z.object({
  keyId,
  locale,
});

export const saveManualTranslationSchema = translationCellSchema.extend({
  value: translationValue,
});

export const acceptTranslationSuggestionSchema = saveManualTranslationSchema;

export const markTranslationReviewedSchema = z.object({
  translationId,
});

export const translationLocaleSchema = z.object({ locale });

export const translationDashboardQuerySchema = z.object({
  projectId,
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  filter: z.enum(['all', 'ai', 'manual', 'needs-review', 'missing']).optional(),
  search: z.string().trim().max(200).optional(),
});
