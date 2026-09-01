import type {
  Project,
  Translation,
  TranslationFilter,
  TranslationKey,
  TranslationSource,
  TranslationStatus,
} from './types';

export type DashboardCell = {
  translationId: string | null;
  locale: string;
  value: string | null;
  source: TranslationSource | null;
  status: TranslationStatus | 'missing';
  aiLocked: boolean;
  missing: boolean;
  updatedAt: string | null;
};

export type DashboardRow = {
  keyId: string;
  key: string;
  sourceText: string;
  searchText: string;
  cells: Record<string, DashboardCell>;
  statuses: Array<TranslationStatus | 'missing'>;
  missingLocales: string[];
};

export type TranslationDashboard = {
  project: Project;
  locales: string[];
  rows: DashboardRow[];
  counts: Record<TranslationFilter, number>;
};

export function projectTranslationDashboard(
  project: Project,
  keys: TranslationKey[],
  translations: Translation[]
): TranslationDashboard {
  const translationsByCell = new Map(
    translations.map((translation) => [
      `${translation.translationKeyId}:${translation.locale}`,
      translation,
    ])
  );
  const counts: Record<TranslationFilter, number> = {
    all: 0,
    ai: 0,
    manual: 0,
    'needs-review': 0,
    missing: 0,
  };

  const rows = keys.map((key): DashboardRow => {
    const statuses = new Set<TranslationStatus | 'missing'>();
    const missingLocales: string[] = [];
    const cells = Object.fromEntries(
      project.locales.map((locale) => {
        const translation = translationsByCell.get(`${key.id}:${locale}`);
        const status: TranslationStatus | 'missing' =
          translation?.status ?? 'missing';
        statuses.add(status);
        counts.all += 1;
        if (
          status === 'ai' ||
          status === 'manual' ||
          status === 'needs-review'
        ) {
          counts[status] += 1;
        } else if (status === 'missing') {
          counts.missing += 1;
          missingLocales.push(locale);
        }

        return [
          locale,
          {
            translationId: translation?.id ?? null,
            locale,
            value: translation?.value ?? null,
            source: translation?.source ?? null,
            status,
            aiLocked: translation?.aiLocked ?? false,
            missing: !translation,
            updatedAt: translation?.updatedAt.toISOString() ?? null,
          },
        ];
      })
    );

    return {
      keyId: key.id,
      key: key.key,
      sourceText: key.sourceText,
      searchText: `${key.key} ${key.sourceText}`.toLocaleLowerCase(),
      cells,
      statuses: Array.from(statuses),
      missingLocales,
    };
  });

  return { project, locales: project.locales, rows, counts };
}
