import { defaultHeaders } from '@/lib/common';
import fetcher from '@/lib/fetcher';
import type { Project } from '../domain/translations';
import type { ApiResponse } from 'types';
import useSWR from 'swr';

type CreateProjectInput = {
  name: string;
  sourceLocale: string;
  locales?: string[];
};

async function createProjectRequest(
  url: string,
  input: CreateProjectInput
): Promise<Project> {
  const response = await fetch(url, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(input),
  });
  const json = (await response.json()) as ApiResponse<Project>;

  if (!response.ok) {
    throw new Error(json.error.message);
  }

  return json.data;
}

const useTeamProjects = (slug: string) => {
  const url = `/api/teams/${slug}/projects`;
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Project[]>>(
    slug ? url : null,
    fetcher
  );

  const createProject = async (input: CreateProjectInput) => {
    const project = await createProjectRequest(url, input);
    await mutate();
    return project;
  };

  return {
    projects: data?.data,
    isLoading,
    isError: error,
    createProject,
  };
};

export default useTeamProjects;
