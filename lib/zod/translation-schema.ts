import { z } from 'zod';

import {
  inferLocaleFormat,
  isCatalogLocale,
  localeFormatError,
  normalizeLocaleTag,
} from '@/domain/translations/locale-catalog';

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

const environmentRef = z.string().trim().min(1).max(64);

export const translationProjectParamsSchema = z.object({
  projectId,
  /** Environment slug or id. Omitted means the project's production. */
  environment: environmentRef.optional(),
});

export const localeFormatSchema = z.enum(['language', 'regional']);

export const createTranslationProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    sourceLocale: locale,
    locales: z.array(locale).max(50).optional(),
    localeFormat: localeFormatSchema.optional(),
    billingScope: z.enum(['team', 'project']).optional(),
  })
  .superRefine((value, ctx) => {
    const format = value.localeFormat ?? inferLocaleFormat(value.sourceLocale);
    if (!isCatalogLocale(value.sourceLocale, format)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: localeFormatError(format),
        path: ['sourceLocale'],
      });
    }
    value.locales?.forEach((item, index) => {
      if (!isCatalogLocale(item, format)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: localeFormatError(format),
          path: ['locales', index],
        });
      }
    });
  })
  .transform((value) => {
    const localeFormat =
      value.localeFormat ?? inferLocaleFormat(value.sourceLocale);
    return {
      ...value,
      localeFormat,
      sourceLocale: normalizeLocaleTag(value.sourceLocale),
      locales: value.locales?.map((item) => normalizeLocaleTag(item)),
    };
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

export const retranslateLocalesSchema = z.object({
  locales: z.array(locale).min(1).max(50),
  sourceLocale: locale.optional(),
});

export const queueTranslationsSchema = z
  .object({
    scope: z.enum(['all-matching', 'selected-keys']),
    keyIds: z.array(keyId).max(10_000).optional(),
    locales: z.array(locale).min(1).max(50),
    mode: z.enum(['fill-missing', 'retranslate']).default('fill-missing'),
    sourceLocale: locale.optional(),
    filter: z
      .enum([
        'all',
        'ai',
        'manual',
        'needs-review',
        'missing',
        'unused',
        'deprecated',
      ])
      .optional(),
    search: z.string().trim().max(200).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.scope === 'selected-keys' && !value.keyIds?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one key',
        path: ['keyIds'],
      });
    }
  });

export const translationDashboardQuerySchema = z.object({
  projectId,
  environment: environmentRef.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  filter: z
    .enum([
      'all',
      'ai',
      'manual',
      'needs-review',
      'missing',
      'unused',
      'deprecated',
    ])
    .optional(),
  search: z.string().trim().max(200).optional(),
});
