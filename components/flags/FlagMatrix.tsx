import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { ApiResponse } from 'types';
import type { FeatureFlag, FlagEnvironmentConfig } from '../../domain/flags';
import type { Environment } from '../../domain/environments';
import { defaultHeaders } from '@/lib/common';
import toast from 'react-hot-toast';

type MatrixPayload = {
  environments: Environment[];
  flags: Array<{ flag: FeatureFlag; configs: Record<string, FlagEnvironmentConfig> }>;
};

const FlagMatrix = ({
  slug,
  projectId,
  canEdit,
}: {
  slug: string;
  projectId: string;
  canEdit: boolean;
}) => {
  const { t } = useTranslation('common');
  const url = `/api/teams/${slug}/projects/${projectId}/flags/matrix`;
  const { data, mutate } = useSWR<ApiResponse<MatrixPayload>>(url, fetcher);
  const payload = data?.data;

  const promote = async (
    flagId: string,
    source: string,
    target: string
  ) => {
    const reason = window.prompt(t('production-change-reason')) ?? '';
    const response = await fetch(
      `/api/teams/${slug}/projects/${projectId}/flags/${flagId}/promote`,
      {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          sourceEnvironment: source,
          targetEnvironment: target,
          reason,
        }),
      }
    );
    if (!response.ok) {
      const json = (await response.json()) as { error?: { message?: string } };
      throw new Error(json.error?.message ?? t('promote-failed'));
    }
    await mutate();
    toast.success(t('flag-promoted'));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('environment-matrix')}</h2>
        <p className="text-sm text-muted-foreground">{t('environment-matrix-help')}</p>
      </div>
      <div className="overflow-x-auto rounded-md bg-card">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>{t('flag-key')}</th>
              {(payload?.environments ?? []).map((environment) => (
                <th key={environment.id}>{environment.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(payload?.flags ?? []).map(({ flag, configs }) => (
              <tr key={flag.id}>
                <td className="font-mono text-xs">{flag.key}</td>
                {(payload?.environments ?? []).map((environment) => {
                  const config = configs[environment.id];
                  return (
                    <td key={environment.id}>
                      <div className="flex flex-col gap-1">
                        <span>
                          {config?.enabled ? 'ON' : 'OFF'}
                          {config?.inherited ? ` · ${t('inherited')}` : ` · ${t('override')}`}
                        </span>
                        {canEdit && environment.parentEnvironmentId ? (
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              const parent = payload?.environments.find(
                                (item) => item.id === environment.parentEnvironmentId
                              );
                              if (!parent) {
                                return;
                              }
                              void promote(flag.id, parent.slug, environment.slug).catch(
                                (error) =>
                                  toast.error(
                                    error instanceof Error ? error.message : t('promote-failed')
                                  )
                              );
                            }}
                            type="button"
                          >
                            {t('promote')}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FlagMatrix;
