import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import type { Environment } from '../../domain/environments';
import type { PromotionPlan } from '../../domain/versions';
import { useProjectVersions } from '../../hooks/useProjectVersions';

type VersionHistoryProps = {
  slug: string;
  projectId: string;
  environment?: string;
  environments: Environment[];
  canPublish: boolean;
};

const VersionHistory = ({
  slug,
  projectId,
  environment,
  environments,
  canPublish,
}: VersionHistoryProps) => {
  const { t } = useTranslation('common');
  const versions = useProjectVersions(slug, projectId, environment);
  const [target, setTarget] = useState('');
  const [plan, setPlan] = useState<PromotionPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const payload = versions.payload;
  const source = payload?.environment.slug ?? environment ?? 'production';

  const preview = async () => {
    if (!target) {
      return;
    }
    setBusy(true);
    try {
      const result = await versions.previewPromote({
        sourceEnvironment: source,
        targetEnvironment: target,
      });
      setPlan(result.plan);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('promote-failed')
      );
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!target) {
      return;
    }
    setBusy(true);
    try {
      const result = await versions.applyPromote({
        sourceEnvironment: source,
        targetEnvironment: target,
      });
      setPlan(result.plan);
      toast.success(t('promoted-translations', { count: result.applied }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('promote-failed')
      );
    } finally {
      setBusy(false);
    }
  };

  if (versions.isLoading || !payload) {
    return (
      <p className="text-sm text-muted-foreground">{t('loading-versions')}</p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card bg-card">
        <div className="card-body space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="card-title text-lg">
                {t('unpublished-changes-title')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('pending-live-version', {
                  count: payload.status.pendingCount,
                  version: payload.status.liveVersion
                    ? `v${payload.status.liveVersion.number}`
                    : t('live-version-none'),
                })}
              </p>
            </div>
            {canPublish ? (
              <button
                className="btn btn-primary btn-sm"
                disabled={busy || payload.status.pendingCount === 0}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await versions.publish();
                    toast.success(t('published'));
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : t('publish-failed')
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
                type="button"
              >
                {t('publish')}
              </button>
            ) : null}
          </div>
          {payload.status.diff.entries.length > 0 ? (
            <ul className="max-h-64 space-y-1 overflow-auto text-sm">
              {payload.status.diff.entries.map((entry) => (
                <li
                  key={`${entry.entityType}-${entry.key}-${
                    'locale' in entry ? entry.locale : ''
                  }`}
                >
                  <span className="badge badge-ghost badge-sm mr-2">
                    {entry.kind}
                  </span>
                  {entry.entityType === 'translation'
                    ? `${entry.key} (${entry.locale})`
                    : entry.key}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('working-copy-matches')}
            </p>
          )}
        </div>
      </section>

      <section className="card bg-card">
        <div className="card-body space-y-3">
          <h2 className="card-title text-lg">{t('version-history')}</h2>
          <ul className="divide-y divide-base-300">
            {payload.versions.map((version) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                key={version.id}
              >
                <div>
                  <p className="font-medium">
                    {`v${version.number}`}{' '}
                    <span className="text-xs uppercase text-muted-foreground">
                      {version.status}
                    </span>
                    {payload.status.liveVersion?.id === version.id
                      ? ` · ${t('version-live')}`
                      : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {version.message || t('no-version-message')}
                    {version.publishedAt
                      ? ` · ${new Date(version.publishedAt).toLocaleString()}`
                      : ''}
                  </p>
                </div>
                {canPublish &&
                version.status === 'published' &&
                payload.status.liveVersion?.id !== version.id ? (
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={async () => {
                      try {
                        await versions.rollback(version.id);
                        toast.success(
                          t('rolled-back-to', { number: version.number })
                        );
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : t('rollback-failed')
                        );
                      }
                    }}
                    type="button"
                  >
                    {t('rollback')}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {environments.length > 1 && canPublish ? (
        <section className="card bg-card">
          <div className="card-body space-y-3">
            <h2 className="card-title text-lg">{t('promote')}</h2>
            <p className="text-sm text-muted-foreground">{t('promote-help')}</p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="form-control">
                <span className="label-text text-xs">{t('promote-target')}</span>
                <select
                  className="select select-bordered select-sm"
                  onChange={(event) => {
                    setTarget(event.target.value);
                    setPlan(null);
                  }}
                  value={target}
                >
                  <option value="">{t('choose-environment')}</option>
                  {environments
                    .filter((item) => item.slug !== source)
                    .map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </label>
              <button
                className="btn btn-outline btn-sm"
                disabled={!target || busy}
                onClick={preview}
                type="button"
              >
                {t('preview')}
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={!target || busy}
                onClick={apply}
                type="button"
              >
                {t('promote')}
              </button>
            </div>
            {plan ? (
              <div className="text-sm">
                <p>
                  {t('promote-summary', {
                    apply: plan.applyCount,
                    conflicts: plan.conflictCount,
                    unchanged: plan.unchangedCount,
                  })}
                </p>
                {plan.conflictCount > 0 ? (
                  <ul className="mt-2 max-h-40 overflow-auto">
                    {plan.entries
                      .filter((entry) => entry.action === 'skip-conflict')
                      .map((entry) => (
                        <li key={`${entry.key}:${entry.locale}`}>
                          {t('kept-human-value', {
                            key: entry.key,
                            locale: entry.locale,
                          })}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default VersionHistory;
