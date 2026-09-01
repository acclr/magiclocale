import { defaultHeaders } from '@/lib/common';
import fetcher from '@/lib/fetcher';
import type {
  Project,
  Translation,
  TranslationDashboard,
} from '../domain/translations';
import type { ApiResponse } from 'types';
import useSWR from 'swr';

type CellInput = {
  keyId: string;
  locale: string;
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

const useTranslationWorkspace = (slug: string, projectId: string) => {
  const baseUrl = `/api/teams/${slug}/projects/${projectId}`;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ApiResponse<TranslationDashboard>
  >(slug && projectId ? dashboardUrl : null, fetcher);

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
    saveManual: (input: CellInput & { value: string }) =>
      mutateAndRefresh<Translation>(`${baseUrl}/translations/manual`, input),
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
>;

export default useTranslationWorkspace;
