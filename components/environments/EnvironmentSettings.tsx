import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { useProjectEnvironments } from '../../hooks/useProjectVersions';

type EnvironmentSettingsProps = {
  slug: string;
  projectId: string;
  canEdit: boolean;
};

const EnvironmentSettings = ({
  slug,
  projectId,
  canEdit,
}: EnvironmentSettingsProps) => {
  const { t } = useTranslation('common');
  const environments = useProjectEnvironments(slug, projectId);
  const [slugValue, setSlugValue] = useState('');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await environments.create({
        slug: slugValue,
        name: name || undefined,
        parentEnvironmentId: parentId || null,
      });
      setSlugValue('');
      setName('');
      setParentId('');
      toast.success(t('environment-created'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('could-not-create-environment')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card bg-card">
      <div className="card-body space-y-4">
        <div>
          <h2 className="card-title text-lg">{t('environments')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('environments-help')}
          </p>
        </div>
        <ul className="divide-y divide-base-300 rounded-lg border border-border">
          {environments.environments.map((environment) => (
            <li
              key={environment.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium">{environment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {environment.slug}
                  {environment.isProduction ? ' · production' : ''}
                  {environment.parentEnvironmentId
                    ? ` · parent ${
                        environments.environments.find(
                          (item) => item.id === environment.parentEnvironmentId
                        )?.name ?? ''
                      }`
                    : ''}
                </p>
              </div>
              {canEdit && !environment.isProduction ? (
                <div className="flex items-center gap-2">
                  <select
                    className="select select-bordered select-xs"
                    onChange={(event) => {
                      void environments
                        .setParent(environment.id, event.target.value || null)
                        .then(() => toast.success(t('saved')))
                        .catch((error) =>
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : t('save-failed')
                          )
                        );
                    }}
                    value={environment.parentEnvironmentId ?? ''}
                  >
                    <option value="">{t('none')}</option>
                    {environments.environments
                      .filter((item) => item.id !== environment.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          t('confirm-delete-environment', {
                            name: environment.name,
                          })
                        )
                      ) {
                        return;
                      }
                      try {
                        await environments.remove(environment.id);
                        toast.success(t('environment-deleted'));
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : t('could-not-delete-environment')
                        );
                      }
                    }}
                    type="button"
                  >
                    {t('delete')}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {canEdit && environments.environments.length < 3 ? (
          <form className="flex flex-wrap items-end gap-3" onSubmit={create}>
            <label className="form-control">
              <span className="label-text text-xs">
                {t('environment-slug')}
              </span>
              <input
                className="input input-bordered input-sm"
                onChange={(event) => setSlugValue(event.target.value)}
                placeholder="staging"
                required
                value={slugValue}
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs">
                {t('environment-name')}
              </span>
              <input
                className="input input-bordered input-sm"
                onChange={(event) => setName(event.target.value)}
                placeholder="Staging"
                value={name}
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs">
                {t('parent-environment')}
              </span>
              <select
                className="select select-bordered select-sm"
                onChange={(event) => setParentId(event.target.value)}
                value={parentId}
              >
                <option value="">{t('none')}</option>
                {environments.environments.map((environment) => (
                  <option key={environment.id} value={environment.id}>
                    {environment.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn btn-primary btn-sm"
              disabled={busy}
              type="submit"
            >
              {busy ? t('adding-environment') : t('add-environment')}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
};

export default EnvironmentSettings;
