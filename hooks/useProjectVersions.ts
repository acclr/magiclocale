import { defaultHeaders } from '@/lib/common';
import fetcher from '@/lib/fetcher';
import type { Environment } from '../domain/environments';
import type {
  PromotionPlan,
  Version,
  VersionChange,
  VersionDiff,
} from '../domain/versions';
import type { ApiResponse } from 'types';
import useSWR from 'swr';
import { withEnvironment } from './useProjectEnvironment';

export type VersionListPayload = {
  environment: Environment;
  versions: Version[];
  status: {
    liveVersion: Version | null;
    draft: Version | null;
    pendingCount: number;
    diff: VersionDiff;
  };
  changes: VersionChange[];
};

async function send<T>(url: string, method: string, body?: object): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok) {
    throw new Error(json.error.message);
  }
  return json.data;
}

export function useProjectVersions(
  slug: string,
  projectId: string,
  environment?: string
) {
  const baseUrl = `/api/teams/${slug}/projects/${projectId}`;
  const listUrl = withEnvironment(`${baseUrl}/versions`, environment);
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<VersionListPayload>
  >(slug && projectId ? listUrl : null, fetcher);

  const refresh = () => mutate();

  return {
    payload: data?.data,
    isLoading,
    isError: error,
    refresh,
    publish: (message?: string) =>
      send(`${baseUrl}/versions/publish`, 'POST', {
        environment,
        message,
      }).then(async (result) => {
        await refresh();
        return result;
      }),
    rollback: (versionId: string) =>
      send(`${baseUrl}/versions/rollback`, 'POST', {
        environment,
        versionId,
      }).then(async (result) => {
        await refresh();
        return result;
      }),
    previewPromote: (input: {
      sourceEnvironment: string;
      targetEnvironment: string;
      versionId?: string;
    }) =>
      send<{ plan: PromotionPlan; applied: false }>(
        `${baseUrl}/versions/promote`,
        'POST',
        { ...input, apply: false }
      ),
    applyPromote: (input: {
      sourceEnvironment: string;
      targetEnvironment: string;
      versionId?: string;
    }) =>
      send<{ plan: PromotionPlan; applied: number }>(
        `${baseUrl}/versions/promote`,
        'POST',
        { ...input, apply: true }
      ).then(async (result) => {
        await refresh();
        return result;
      }),
  };
}

export function useProjectEnvironments(slug: string, projectId: string) {
  const url = `/api/teams/${slug}/projects/${projectId}/environments`;
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Environment[]>>(
    slug && projectId ? url : null,
    fetcher
  );

  return {
    environments: data?.data ?? [],
    isLoading,
    isError: error,
    refresh: () => mutate(),
    create: async (input: {
      slug: string;
      name?: string;
      parentEnvironmentId?: string | null;
    }) => {
      const environment = await send<Environment>(url, 'POST', input);
      await mutate();
      return environment;
    },
    rename: async (environmentId: string, name: string) => {
      const environment = await send<Environment>(url, 'PATCH', {
        environmentId,
        name,
      });
      await mutate();
      return environment;
    },
    setParent: async (
      environmentId: string,
      parentEnvironmentId: string | null
    ) => {
      const environment = await send<Environment>(url, 'PATCH', {
        environmentId,
        parentEnvironmentId,
      });
      await mutate();
      return environment;
    },
    remove: async (environmentId: string) => {
      await send<void>(url, 'DELETE', { environmentId });
      await mutate();
    },
  };
}
