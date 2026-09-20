import type { Environment } from '../environments/types';
import type { KeyMeta } from '../keys/types';
import { parseSearchQuery } from '../keys/search';
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
  namespace: string | null;
  owner: string | null;
  usageCount: number;
  usageFiles: string[];
  lifecycle: string;
  cells: Record<string, DashboardCell>;
  statuses: Array<TranslationStatus | 'missing'>;
  missingLocales: string[];
};

export type TranslationDashboard = {
  project: Project;
  /** The environment whose working copy these rows come from. */
  environment: Environment;
  locales: string[];
  rows: DashboardRow[];
  counts: Record<TranslationFilter, number>;
  pagination: DashboardPagination;
};

export type DashboardPagination = {
  page: number;
  pageSize: number;
  totalKeys: number;
  totalPages: number;
};

export type DashboardQuery = {
  page: number;
  pageSize: number;
  filter: TranslationFilter;
  search: string;
};

export const DEFAULT_DASHBOARD_PAGE_SIZE = 50;
export const MIN_DASHBOARD_PAGE_SIZE = 1;
export const MAX_DASHBOARD_PAGE_SIZE = 100;

export function normalizeDashboardQuery(
  input: Partial<DashboardQuery> = {}
): DashboardQuery {
  const pageSize = Math.min(
    MAX_DASHBOARD_PAGE_SIZE,
    Math.max(
      MIN_DASHBOARD_PAGE_SIZE,
      input.pageSize ?? DEFAULT_DASHBOARD_PAGE_SIZE
    )
  );
  return {
    page: Math.max(1, input.page ?? 1),
    pageSize,
    filter: input.filter ?? 'all',
    search: (input.search ?? '').trim().toLocaleLowerCase(),
  };
}

export function projectTranslationDashboard(
  project: Project,
  environment: Environment,
  keys: TranslationKey[],
  translations: Translation[],
  catalogByKey: Record<string, KeyMeta> = {},
  usageFilesByKey: Record<string, string[]> = {}
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
    unused: 0,
    deprecated: 0,
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

    const catalog = catalogByKey[key.key];
    const cellValues = project.locales
      .map((locale) => translationsByCell.get(`${key.id}:${locale}`)?.value ?? '')
      .join(' ');

    return {
      keyId: key.id,
      key: key.key,
      sourceText: key.sourceText,
      searchText: `${key.key} ${key.sourceText} ${cellValues} ${
        catalog?.description ?? ''
      } ${catalog?.owner ?? ''}`.toLocaleLowerCase(),
      namespace: catalog?.namespace ?? null,
      owner: catalog?.owner ?? null,
      usageCount: catalog?.usageCount ?? 0,
      usageFiles: usageFilesByKey[key.key] ?? [],
      lifecycle: catalog?.lifecycle ?? 'active',
      cells,
      statuses: Array.from(statuses),
      missingLocales,
    };
  });

  for (const row of rows) {
    if (row.lifecycle === 'unused' || row.usageCount === 0) {
      counts.unused += 1;
    }
    if (row.lifecycle === 'deprecated') {
      counts.deprecated += 1;
    }
  }

  return {
    project,
    environment,
    locales: project.locales,
    rows,
    counts,
    pagination: {
      page: 1,
      pageSize: Math.max(rows.length, 1),
      totalKeys: rows.length,
      totalPages: 1,
    },
  };
}

export function filterDashboardRows(
  rows: DashboardRow[],
  queryInput: Partial<DashboardQuery> = {}
): DashboardRow[] {
  const query = normalizeDashboardQuery(queryInput);
  const parsed = parseSearchQuery(query.search);
  return rows.filter((row) => {
    if (query.filter === 'unused') {
      if (row.lifecycle !== 'unused' && row.usageCount !== 0) {
        return false;
      }
    } else if (query.filter === 'deprecated') {
      if (row.lifecycle !== 'deprecated') {
        return false;
      }
    } else if (query.filter !== 'all' && !row.statuses.includes(query.filter)) {
      return false;
    }
    if (parsed.fields.namespace && !row.key.startsWith(parsed.fields.namespace)) {
      return false;
    }
    if (parsed.fields.owner && (row.owner ?? '').toLowerCase() !== parsed.fields.owner.toLowerCase()) {
      return false;
    }
    if (parsed.fields.file) {
      const needle = parsed.fields.file.toLowerCase();
      if (!row.usageFiles.some((file) => file.toLowerCase().includes(needle))) {
        return false;
      }
    }
    const locale = parsed.fields.locale;
    if (locale) {
      const cell = row.cells[locale];
      if (!cell) {
        return false;
      }
      if (parsed.fields.status === 'missing' && !cell.missing) {
        return false;
      }
      if (
        parsed.text &&
        !(cell.value ?? '').toLocaleLowerCase().includes(parsed.text) &&
        !row.key.toLocaleLowerCase().includes(parsed.text) &&
        !row.sourceText.toLocaleLowerCase().includes(parsed.text)
      ) {
        return false;
      }
    } else if (parsed.fields.status === 'missing' && !row.missingLocales.length) {
      return false;
    }
    if (parsed.fields.usage === '0' && row.usageCount !== 0) {
      return false;
    }
    const haystack = row.searchText;
    if (parsed.fields.source && !row.sourceText.toLocaleLowerCase().includes(parsed.fields.source.toLocaleLowerCase())) {
      return false;
    }
    if (locale) {
      return true;
    }
    return !parsed.text || haystack.includes(parsed.text);
  });
}

export function paginateTranslationDashboard(
  dashboard: TranslationDashboard,
  queryInput: Partial<DashboardQuery> = {}
): TranslationDashboard {
  const query = normalizeDashboardQuery(queryInput);
  const filtered = filterDashboardRows(dashboard.rows, queryInput);
  const totalKeys = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalKeys / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;

  return {
    ...dashboard,
    rows: filtered.slice(start, start + query.pageSize),
    pagination: {
      page,
      pageSize: query.pageSize,
      totalKeys,
      totalPages,
    },
  };
}
