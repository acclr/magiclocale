import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';

import { useProjectKeys } from '../../hooks/useProjectKeys';
import fetcher from '@/lib/fetcher';
import type { ApiResponse } from 'types';
import type {
  ArchitectureHealth,
  FindingKind,
} from '../../domain/architecture';

type KeyExplorerProps = {
  slug: string;
  projectId: string;
};

const FINDING_KINDS: FindingKind[] = [
  'unused-key',
  'stale-flag',
  'unknown-flag',
  'duplicate-translation',
  'overlapping-flags',
  'namespace-inconsistency',
  'missing-owner',
  'missing-description',
  'naming-issue',
  'temporary-flag-overdue',
];

const KeyExplorer = ({ slug, projectId }: KeyExplorerProps) => {
  const { t } = useTranslation('common');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const keys = useProjectKeys(slug, projectId, { search, type });
  const base = `/teams/${slug}/projects/${projectId}`;
  const { data: architecture } = useSWR<
    ApiResponse<{ health: ArchitectureHealth }>
  >(
    slug && projectId
      ? `/api/teams/${slug}/projects/${projectId}/architecture`
      : null,
    fetcher
  );
  const health = architecture?.data?.health;
  const openFindings = FINDING_KINDS.filter(
    (kind) => (health?.findings[kind] ?? 0) > 0
  );
  const openCount = openFindings.reduce(
    (sum, kind) => sum + (health?.findings[kind] ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t('keys')}</h1>
        <p className="text-sm text-muted-foreground">{t('keys-help')}</p>
      </div>
      {health ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            className="rounded-md bg-card p-4"
            href={`${base}/architecture`}
          >
            <p className="text-xs uppercase text-muted-foreground">
              {t('open-findings')}
            </p>
            <p className="text-2xl font-semibold">{openCount}</p>
          </Link>
          {openFindings.slice(0, 3).map((kind) => (
            <Link
              className="rounded-md bg-card p-4"
              href={`${base}/architecture`}
              key={kind}
            >
              <p className="text-xs uppercase text-muted-foreground">
                {kind.replace(/-/g, ' ')}
              </p>
              <p className="text-2xl font-semibold">{health.findings[kind]}</p>
            </Link>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <input
          className="input input-bordered input-sm w-80"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('keys-help-search')}
          value={search}
        />
        <select
          className="select select-bordered select-sm"
          onChange={(event) => setType(event.target.value)}
          value={type}
        >
          <option value="all">{t('all')}</option>
          <option value="translation">{t('translation')}</option>
          <option value="feature-flag">{t('feature-flags')}</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-md bg-card">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>{t('type')}</th>
              <th>{t('translation-key')}</th>
              <th>{t('namespace')}</th>
              <th>{t('lifecycle')}</th>
              <th>{t('usages')}</th>
              <th>{t('owner')}</th>
            </tr>
          </thead>
          <tbody>
            {(keys.catalog?.items ?? []).map((item) => (
              <tr key={item.id}>
                <td>
                  {item.type === 'feature-flag'
                    ? t('feature-flags')
                    : t('translation')}
                </td>
                <td>
                  <Link
                    className="link link-hover font-mono text-xs"
                    href={`${base}/keys/${item.id}`}
                  >
                    {item.key}
                  </Link>
                </td>
                <td className="font-mono text-xs">{item.namespace ?? '—'}</td>
                <td>{item.lifecycle}</td>
                <td>{item.usageCount}</td>
                <td>{item.owner ?? '—'}</td>
              </tr>
            ))}
            {!keys.catalog?.items.length ? (
              <tr>
                <td
                  className="py-8 text-center text-muted-foreground"
                  colSpan={6}
                >
                  {t('no-matching-keys')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KeyExplorer;
