import fetcher from '@/lib/fetcher';
import type { CatalogList, KeyMeta, SourceUsage } from '../domain/keys';
import type { ApiResponse } from 'types';
import useSWR from 'swr';
import { defaultHeaders } from '@/lib/common';

export function useProjectKeys(
  slug: string,
  projectId: string,
  query: { search?: string; type?: string; lifecycle?: string } = {}
) {
  const params = new URLSearchParams({ projectId });
  if (query.search) params.set('search', query.search);
  if (query.type) params.set('type', query.type);
  if (query.lifecycle) params.set('lifecycle', query.lifecycle);
  const url = `/api/teams/${slug}/projects/${projectId}/keys?${params}`;
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<CatalogList>>(
    slug && projectId ? url : null,
    fetcher
  );
  return {
    catalog: data?.data,
    isLoading,
    isError: error,
    refresh: () => mutate(),
  };
}

export function useKeyDetail(
  slug: string,
  projectId: string,
  keyMetaId: string
) {
  const url = `/api/teams/${slug}/projects/${projectId}/keys/${keyMetaId}`;
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<{
      meta: KeyMeta;
      usages: SourceUsage[];
      sourceText?: string | null;
    }>
  >(slug && projectId && keyMetaId ? url : null, fetcher);

  return {
    detail: data?.data,
    isLoading,
    isError: error,
    refresh: () => mutate(),
    update: async (patch: Partial<KeyMeta>) => {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: defaultHeaders,
        body: JSON.stringify(patch),
      });
      const json = (await response.json()) as ApiResponse<KeyMeta>;
      if (!response.ok) {
        throw new Error(json.error.message);
      }
      await mutate();
      return json.data;
    },
  };
}
