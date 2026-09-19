import { defaultHeaders } from '@/lib/common';
import fetcher from '@/lib/fetcher';
import type { Environment } from '../domain/environments';
import type {
  FeatureFlag,
  FlagRuleInput,
  FlagWithConfig,
  UpsertFlagConfigInput,
} from '../domain/flags';
import type { ApiResponse } from 'types';
import useSWR from 'swr';
import { withEnvironment } from './useProjectEnvironment';

export type FlagListPayload = {
  environment: Environment;
  flags: FlagWithConfig[];
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

export function useProjectFlags(
  slug: string,
  projectId: string,
  environment?: string
) {
  const baseUrl = `/api/teams/${slug}/projects/${projectId}/flags`;
  const listUrl = withEnvironment(baseUrl, environment);
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<FlagListPayload>
  >(slug && projectId ? listUrl : null, fetcher);

  const refresh = () => mutate();

  return {
    environment: data?.data.environment,
    flags: data?.data.flags ?? [],
    isLoading,
    isError: error,
    refresh,
    createFlag: async (input: {
      key: string;
      name?: string;
      description?: string;
      type?: FeatureFlag['type'];
      visibility?: FeatureFlag['visibility'];
    }) => {
      const flag = await send<FeatureFlag>(baseUrl, 'POST', input);
      await refresh();
      return flag;
    },
    updateFlag: async (
      flagId: string,
      patch: {
        name?: string;
        description?: string;
        visibility?: FeatureFlag['visibility'];
        archived?: boolean;
      }
    ) => {
      const flag = await send<FeatureFlag>(`${baseUrl}/${flagId}`, 'PATCH', patch);
      await refresh();
      return flag;
    },
    deleteFlag: async (flagId: string) => {
      await send<void>(`${baseUrl}/${flagId}`, 'DELETE');
      await refresh();
    },
    setConfig: async (flagId: string, patch: UpsertFlagConfigInput) => {
      const result = await send<FlagWithConfig>(
        `${baseUrl}/${flagId}/config`,
        'PATCH',
        { ...patch, environment }
      );
      await refresh();
      return result;
    },
    setRules: async (
      flagId: string,
      rules: FlagRuleInput[],
      reason?: string
    ) => {
      const result = await send<FlagWithConfig>(
        `${baseUrl}/${flagId}/rules`,
        'PUT',
        { environment, rules, reason }
      );
      await refresh();
      return result;
    },
  };
}
