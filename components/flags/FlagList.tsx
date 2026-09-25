import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import type { FlagType, FlagVisibility } from '../../domain/flags';
import { useProjectFlags } from '../../hooks/useProjectFlags';
import FlagDrawer from './FlagDrawer';

type FlagListProps = {
  slug: string;
  projectId: string;
  environment?: string;
  canEdit: boolean;
};

const TYPES: FlagType[] = ['boolean', 'string', 'number', 'json'];

const FlagList = ({ slug, projectId, environment, canEdit }: FlagListProps) => {
  const { t } = useTranslation('common');
  const flags = useProjectFlags(slug, projectId, environment);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<FlagType>('boolean');
  const [visibility, setVisibility] = useState<FlagVisibility>('public');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = flags.flags.find((item) => item.flag.key === selectedKey);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await flags.createFlag({
        key,
        name: name || undefined,
        type,
        visibility,
      });
      setKey('');
      setName('');
      toast.success(t('flag-created'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('could-not-create-flag')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canEdit ? (
        <form
          className="flex flex-wrap items-end gap-3 rounded-md bg-card p-4"
          onSubmit={create}
        >
          <label className="form-control">
            <span className="label-text text-xs">{t('flag-key')}</span>
            <input
              className="input input-bordered input-sm"
              onChange={(event) => setKey(event.target.value)}
              placeholder="checkout-v2"
              required
              value={key}
            />
          </label>
          <label className="form-control">
            <span className="label-text text-xs">{t('flag-name')}</span>
            <input
              className="input input-bordered input-sm"
              onChange={(event) => setName(event.target.value)}
              placeholder="Checkout v2"
              value={name}
            />
          </label>
          <label className="form-control">
            <span className="label-text text-xs">{t('flag-type')}</span>
            <select
              className="select select-bordered select-sm"
              onChange={(event) => setType(event.target.value as FlagType)}
              value={type}
            >
              {TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text text-xs">{t('flag-visibility')}</span>
            <select
              className="select select-bordered select-sm"
              onChange={(event) =>
                setVisibility(event.target.value as FlagVisibility)
              }
              value={visibility}
            >
              <option value="public">{t('flag-visibility-public')}</option>
              <option value="server-only">
                {t('flag-visibility-server-only')}
              </option>
            </select>
          </label>
          <button
            className="btn btn-primary btn-sm"
            disabled={busy}
            type="submit"
          >
            {busy ? t('creating-flag') : t('create-flag')}
          </button>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-md bg-card">
        <table className="table table-sm [&_td]:px-2.5 [&_td]:py-2 [&_th]:px-2.5 [&_th]:py-2">
          <thead>
            <tr>
              <th>{t('flag-key')}</th>
              <th>{t('flag-type')}</th>
              <th>{t('flag-enabled')}</th>
              <th>{t('flag-default')}</th>
              <th>{t('flag-rollout')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {flags.flags.length === 0 ? (
              <tr>
                <td className="text-muted-foreground" colSpan={6}>
                  {t('no-feature-flags')}
                </td>
              </tr>
            ) : (
              flags.flags.map(({ flag, config }) => (
                <tr key={flag.id}>
                  <td>
                    <button
                      className="link link-hover font-medium"
                      onClick={() => setSelectedKey(flag.key)}
                      type="button"
                    >
                      {flag.key}
                    </button>
                    <p className="text-xs text-muted-foreground">{flag.name}</p>
                  </td>
                  <td>{flag.type}</td>
                  <td>{config.enabled ? t('enabled') : t('disabled')}</td>
                  <td className="max-w-xs truncate font-mono text-xs">
                    {JSON.stringify(config.defaultValue)}
                  </td>
                  <td>
                    {config.rolloutPercentage === null
                      ? '—'
                      : `${config.rolloutPercentage}%`}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => setSelectedKey(flag.key)}
                      type="button"
                    >
                      {t('edit')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <FlagDrawer
          canEdit={canEdit}
          item={selected}
          onClose={() => setSelectedKey(null)}
          onDelete={async () => {
            await flags.deleteFlag(selected.flag.id);
            setSelectedKey(null);
          }}
          onSaveConfig={(patch) => flags.setConfig(selected.flag.id, patch)}
          onSaveRules={(rules, reason) =>
            flags.setRules(selected.flag.id, rules, reason)
          }
          onUpdate={(patch) => flags.updateFlag(selected.flag.id, patch)}
        />
      ) : null}
    </div>
  );
};

export default FlagList;
