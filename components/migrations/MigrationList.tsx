import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { ApiResponse } from 'types';
import type { KeyMigration } from '../../domain/migrations';
import { defaultHeaders } from '@/lib/common';
import toast from 'react-hot-toast';

const MigrationList = ({
  slug,
  projectId,
  canEdit,
}: {
  slug: string;
  projectId: string;
  canEdit: boolean;
}) => {
  const { t } = useTranslation('common');
  const url = `/api/teams/${slug}/projects/${projectId}/migrations`;
  const { data, mutate } = useSWR<ApiResponse<KeyMigration[]>>(url, fetcher);
  const [name, setName] = useState('');
  const [fromKey, setFromKey] = useState('');
  const [toKey, setToKey] = useState('');
  const [json, setJson] = useState('');

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch(url, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        name,
        operations: [
          {
            type: 'rename-key',
            keyType: 'translation',
            fromKey,
            toKey,
          },
        ],
      }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: { message?: string } };
      throw new Error(body.error?.message ?? t('migration-failed'));
    }
    setName('');
    setFromKey('');
    setToKey('');
    await mutate();
    toast.success(t('migration-created'));
  };

  const apply = async (id: string) => {
    const response = await fetch(`${url}/${id}`, { method: 'POST' });
    if (!response.ok) {
      const body = (await response.json()) as { error?: { message?: string } };
      throw new Error(body.error?.message ?? t('migration-failed'));
    }
    await mutate();
    toast.success(t('migration-applied'));
  };

  const importJson = async () => {
    const parsed = JSON.parse(json) as unknown;
    const response = await fetch(
      `/api/teams/${slug}/projects/${projectId}/migrations/import`,
      {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ translations: parsed }),
      }
    );
    if (!response.ok) {
      throw new Error(t('import-failed'));
    }
    toast.success(t('import-complete'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('migrations')}</h1>
        <p className="text-sm text-muted-foreground">{t('migrations-help')}</p>
      </div>

      {canEdit ? (
        <form className="space-y-3 rounded-md bg-card p-4" onSubmit={(event) => void create(event).catch((error) => toast.error(error.message))}>
          <h2 className="font-medium">{t('create-migration')}</h2>
          <input
            className="input input-bordered input-sm w-full"
            onChange={(event) => setName(event.target.value)}
            placeholder={t('migration-name')}
            required
            value={name}
          />
          <div className="flex gap-2">
            <input
              className="input input-bordered input-sm flex-1"
              onChange={(event) => setFromKey(event.target.value)}
              placeholder="from.key"
              required
              value={fromKey}
            />
            <input
              className="input input-bordered input-sm flex-1"
              onChange={(event) => setToKey(event.target.value)}
              placeholder="to.key"
              required
              value={toKey}
            />
          </div>
          <button className="btn btn-primary btn-sm" type="submit">
            {t('create-migration')}
          </button>
        </form>
      ) : null}

      <ul className="space-y-3">
        {(data?.data ?? []).map((migration) => (
          <li className="rounded-md bg-card p-4" key={migration.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{migration.name}</p>
                <p className="text-xs text-muted-foreground">
                  {migration.status} · {migration.operations.length} ops
                </p>
              </div>
              {canEdit && migration.status !== 'applied' ? (
                <button
                  className="btn btn-sm"
                  onClick={() => void apply(migration.id).catch((error) => toast.error(error.message))}
                  type="button"
                >
                  {t('apply')}
                </button>
              ) : null}
            </div>
            <pre className="mt-2 overflow-x-auto text-xs">
              {JSON.stringify(
                {
                  id: migration.id,
                  operations: migration.operations.map((operation) => ({
                    type: operation.type,
                    fromKey: operation.fromKey,
                    toKey: operation.toKey,
                  })),
                },
                null,
                2
              )}
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">{t('cli-apply-help')}</p>
          </li>
        ))}
      </ul>

      {canEdit ? (
        <section className="space-y-2 rounded-md bg-card p-4">
          <h2 className="font-medium">{t('import-json')}</h2>
          <textarea
            className="textarea textarea-bordered w-full font-mono text-xs"
            onChange={(event) => setJson(event.target.value)}
            placeholder='{ "common": { "save": "Save" } }'
            rows={6}
            value={json}
          />
          <button
            className="btn btn-sm"
            onClick={() => void importJson().catch((error) => toast.error(error.message))}
            type="button"
          >
            {t('import')}
          </button>
        </section>
      ) : null}
    </div>
  );
};

export default MigrationList;
