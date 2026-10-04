import fetcher from '@/lib/fetcher';
import type { Permission } from '@/lib/permissions';
import useSWR from 'swr';
import type { ApiResponse } from 'types';

import useCurrentTeamSlug from './useCurrentTeamSlug';

const usePermissions = () => {
  const teamSlug = useCurrentTeamSlug();

  const { data, error, isLoading } = useSWR<ApiResponse<Permission[]>>(
    teamSlug ? `/api/teams/${teamSlug}/permissions` : null,
    fetcher
  );

  return {
    isLoading,
    isError: error,
    permissions: data?.data,
  };
};

export default usePermissions;
