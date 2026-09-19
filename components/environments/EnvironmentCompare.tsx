import { useTranslation } from '@/hooks/useTranslation';
import { useProjectEnvironments } from '../../hooks/useProjectVersions';
import { useState } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { ApiResponse } from 'types';
import type { EnvironmentComparison } from '../../domain/environments';

const EnvironmentCompare = ({
  slug,
  projectId,
}: {
  slug: string;
  projectId: string;
}) => {
  const { t } = useTranslation('common');
  const { environments } = useProjectEnvironments(slug, projectId);
  const [left, setLeft] = useState('staging');
  const [right, setRight] = useState('production');
  const ready = left && right && left !== right;
  const url = ready
    ? `/api/teams/${slug}/projects/${projectId}/compare?left=${encodeURIComponent(
        left
      )}&right=${encodeURIComponent(right)}`
    : null;
  const { data } = useSWR<ApiResponse<EnvironmentComparison>>(url, fetcher);
  const comparison = data?.data;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t('compare-environments')}</h1>
        <p className="text-sm text-muted-foreground">{t('compare-help')}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <select
          className="select select-bordered select-sm"
          onChange={(event) => setLeft(event.target.value)}
          value={left}
        >
          {environments.map((environment) => (
            <option key={environment.id} value={environment.slug}>
              {environment.name}
            </option>
          ))}
        </select>
        <select
          className="select select-bordered select-sm"
          onChange={(event) => setRight(event.target.value)}
          value={right}
        >
          {environments.map((environment) => (
            <option key={environment.id} value={environment.slug}>
              {environment.name}
            </option>
          ))}
        </select>
      </div>
      {comparison ? (
        <div className="space-y-4">
          <p className="text-sm">
            {comparison.flags.length + comparison.translations.length}{' '}
            {t('differences')}
          </p>
          <table className="table table-sm">
            <thead>
              <tr>
                <th>{t('type')}</th>
                <th>{t('translation-key')}</th>
                <th>{comparison.left.name}</th>
                <th>{comparison.right.name}</th>
              </tr>
            </thead>
            <tbody>
              {comparison.flags.map((row) => (
                <tr key={`flag-${row.key}`}>
                  <td>{t('feature-flags')}</td>
                  <td className="font-mono text-xs">{row.key}</td>
                  <td>{row.left ? (row.left.enabled ? 'ON' : 'OFF') : '—'}</td>
                  <td>{row.right ? (row.right.enabled ? 'ON' : 'OFF') : '—'}</td>
                </tr>
              ))}
              {comparison.translations.map((row) => (
                <tr key={`${row.key}:${row.locale}`}>
                  <td>{t('translation')}</td>
                  <td className="font-mono text-xs">
                    {row.key} ({row.locale})
                  </td>
                  <td>{row.left ?? '—'}</td>
                  <td>{row.right ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default EnvironmentCompare;
