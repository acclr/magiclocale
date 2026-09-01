import { defaultHeaders } from '@/lib/common';
import fetcher from '@/lib/fetcher';
import type {
  Project,
  Translation,
  TranslationDashboard,
  TranslationFilter,
} from '../domain/translations';
import type { ApiResponse } from 'types';
import useSWR from 'swr';

type CellInput = {
  keyId: string;
  locale: string;
};

export type WorkspaceQuery = {
  page?: number;
  pageSize?: number;
  filter?: TranslationFilter;
  search?: string;
};

async function send<T>(url: string, method: string, body?: object): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok) {
    throw new Error(json.error.message);
  }
  return json.data;
}

const useTranslationWorkspace = (
  slug: string,
  projectId: string,
  query: WorkspaceQuery = {}
) => {
  const baseUrl = `/api/teams/${slug}/projects/${projectId}`;
  const params = new URLSearchParams();
  if (query.page) {
    params.set('page', String(query.page));
  }
  if (query.pageSize) {
    params.set('pageSize', String(query.pageSize));
  }
  if (query.filter && query.filter !== 'all') {
    params.set('filter', query.filter);
  }
  if (query.search) {
    params.set('search', query.search);
  }
  const queryString = params.toString();
  const dashboardUrl = `${baseUrl}/dashboard${
    queryString ? `?${queryString}` : ''
  }`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ApiResponse<TranslationDashboard>
  >(slug && projectId ? dashboardUrl : null, fetcher, {
    keepPreviousData: true,
  });

  const refresh = async () => {
    await mutate();
  };

  const mutateAndRefresh = async <T>(
    url: string,
    body: object,
    method = 'POST'
  ) => {
    const result = await send<T>(url, method, body);
    await refresh();
    return result;
  };

  return {
    dashboard: data?.data,
    isLoading,
    isRefreshing: isValidating,
    isError: error,
    refresh,
    saveManual: async (
      input: CellInput & { value: string },
      options?: { refresh?: boolean }
    ) => {
      const result = await send<Translation>(
        `${baseUrl}/translations/manual`,
        'POST',
        input
      );
      if (options?.refresh !== false) {
        await refresh();
      }
      return result;
    },
    suggest: (input: CellInput) =>
      send<{ value: string }>(
        `${baseUrl}/translations/suggestion`,
        'POST',
        input
      ).then(({ value }) => value),
    acceptSuggestion: (input: CellInput & { value: string }) =>
      mutateAndRefresh<Translation>(
        `${baseUrl}/translations/accept-suggestion`,
        input
      ),
    markReviewed: (translationId: string) =>
      mutateAndRefresh<Translation>(`${baseUrl}/translations/mark-reviewed`, {
        translationId,
      }),
    addLocale: (locale: string) =>
      mutateAndRefresh<{
        project: TranslationDashboard['project'];
        filled: number;
        skipped: number;
      }>(`${baseUrl}/locales`, { locale }),
    removeLocale: (locale: string) =>
      mutateAndRefresh<Project>(`${baseUrl}/locales`, { locale }, 'DELETE'),
    renameProject: (name: string) =>
      mutateAndRefresh<Project>(baseUrl, { name }, 'PATCH'),
    deleteProject: async () => {
      await send<void>(baseUrl, 'DELETE');
    },
    fillMissing: (locale: string) =>
      mutateAndRefresh<{ filled: number; skipped: number }>(
        `${baseUrl}/translations/fill-missing`,
        { locale }
      ),
    retranslate: (locales: string[], sourceLocale?: string) =>
      mutateAndRefresh<{ filled: number; skipped: number; failed: number }>(
        `${baseUrl}/translations/retranslate`,
        { locales, sourceLocale }
      ),
  };
};

export type TranslationWorkspaceActions = Pick<
  ReturnType<typeof useTranslationWorkspace>,
  | 'saveManual'
  | 'suggest'
  | 'acceptSuggestion'
  | 'markReviewed'
  | 'addLocale'
  | 'fillMissing'
  | 'retranslate'
>;

export default useTranslationWorkspace;
