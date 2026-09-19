import { extractVariables } from '@/domain/keys';
import { useTranslation } from '@/hooks/useTranslation';
import { defaultHeaders } from '@/lib/common';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useKeyDetail } from '../../hooks/useProjectKeys';
import fetcher from '@/lib/fetcher';
import useSWR from 'swr';
import type { ApiResponse } from 'types';
import type { VersionChange } from '../../domain/versions';
import { useProjectEnvironment } from '../../hooks/useProjectEnvironment';

type KeyDetailProps = {
  slug: string;
  projectId: string;
  keyMetaId: string;
  canEdit: boolean;
};

const KeyDetail = ({ slug, projectId, keyMetaId, canEdit }: KeyDetailProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { environment } = useProjectEnvironment();
  const detail = useKeyDetail(slug, projectId, keyMetaId);
  const [owner, setOwner] = useState('');
  const [description, setDescription] = useState('');
  const historyUrl = `/api/teams/${slug}/projects/${projectId}/keys/${keyMetaId}/history?environment=${encodeURIComponent(
    environment || 'production'
  )}`;
  const { data: history, mutate: refreshHistory } = useSWR<
    ApiResponse<VersionChange[]>
  >(slug && keyMetaId ? historyUrl : null, fetcher);

  useEffect(() => {
    if (!detail.detail) {
      return;
    }
    setOwner(detail.detail.meta.owner ?? '');
    setDescription(detail.detail.meta.description ?? '');
  }, [detail.detail]);

  if (detail.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }
  if (!detail.detail) {
    return <p>{t('key-not-found')}</p>;
  }

  const { meta, usages, sourceText } = detail.detail;
  const variables = extractVariables(sourceText || description || '');

  const restore = async (changeId: string) => {
    const response = await fetch(historyUrl, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ changeId }),
    });
    if (!response.ok) {
      const json = (await response.json()) as { error?: { message?: string } };
      throw new Error(json.error?.message ?? t('restore-failed'));
    }
    await refreshHistory();
    toast.success(t('restored-to-draft'));
  };

  return (
    <div className="space-y-6">
      <button className="btn btn-ghost btn-sm" onClick={() => router.back()} type="button">
        {t('back')}
      </button>
      <div>
        <p className="text-xs uppercase text-muted-foreground">{meta.type}</p>
        <h1 className="font-mono text-2xl font-semibold">{meta.key}</h1>
        <p className="text-sm text-muted-foreground">
          {t('namespace')}: {meta.namespace ?? '—'} · {t('lifecycle')}: {meta.lifecycle} ·{' '}
          {t('usages')}: {meta.usageCount}
        </p>
        {meta.type === 'feature-flag' ? (
          <p className="mt-2 text-sm">
            <Link className="link" href={`/teams/${slug}/projects/${projectId}/flags`}>
              {t('environment-matrix')}
            </Link>
          </p>
        ) : null}
      </div>

      {sourceText ? (
        <section className="rounded-md bg-card p-4">
          <h2 className="mb-2 font-semibold">{t('source-text')}</h2>
          <p className="text-sm">{sourceText}</p>
        </section>
      ) : null}

      <section className="space-y-3 rounded-md bg-card p-4">
        <label className="form-control">
          <span className="label-text">{t('owner')}</span>
          <input
            className="input input-bordered input-sm"
            disabled={!canEdit}
            onChange={(event) => setOwner(event.target.value)}
            value={owner}
          />
        </label>
        <label className="form-control">
          <span className="label-text">{t('description')}</span>
          <textarea
            className="textarea textarea-bordered"
            disabled={!canEdit}
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </label>
        {variables.length ? (
          <p className="text-xs text-muted-foreground">
            {t('variables')}: {variables.map((name) => `{{${name}}}`).join(', ')}
          </p>
        ) : null}
        {canEdit ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={async () => {
              try {
                await detail.update({ owner, description });
                toast.success(t('saved'));
              } catch (error) {
                toast.error(error instanceof Error ? error.message : t('save-failed'));
              }
            }}
            type="button"
          >
            {t('save')}
          </button>
        ) : null}
      </section>

      <section className="rounded-md bg-card p-4">
        <h2 className="mb-3 font-semibold">{t('source-usages')}</h2>
        {usages.length ? (
          <ul className="space-y-1 font-mono text-xs">
            {usages.map((usage) => (
              <li key={usage.id}>
                {usage.file}:{usage.line}
                {usage.repository ? ` · ${usage.repository}` : ''}
                {usage.branch ? `@${usage.branch}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t('no-usages')}</p>
        )}
      </section>

      <section className="rounded-md bg-card p-4">
        <h2 className="mb-3 font-semibold">{t('history')}</h2>
        {(history?.data ?? []).length ? (
          <ul className="space-y-2 text-sm">
            {(history?.data ?? []).map((change) => (
              <li key={change.id} className="rounded border border-border p-2">
                <p className="text-xs text-muted-foreground">
                  {new Date(change.createdAt).toLocaleString()} · {change.actor ?? 'system'}
                  {change.reason ? ` · ${change.reason}` : ''}
                  {change.locale ? ` · ${change.locale}` : ''}
                </p>
                <pre className="mt-1 overflow-x-auto text-xs">
                  {JSON.stringify({ before: change.before, after: change.after }, null, 2)}
                </pre>
                {canEdit ? (
                  <button
                    className="btn btn-ghost btn-xs mt-2"
                    onClick={() =>
                      void restore(change.id).catch((error) =>
                        toast.error(
                          error instanceof Error ? error.message : t('restore-failed')
                        )
                      )
                    }
                    type="button"
                  >
                    {t('restore-to-draft')}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t('no-history')}</p>
        )}
      </section>
    </div>
  );
};

export default KeyDetail;
