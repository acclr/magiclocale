import type {
  TranslationFilter,
  DashboardRow,
} from '../../domain/translations';
import useTranslationWorkspace from '../../hooks/useTranslationWorkspace';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Error as ErrorDisplay, Loading } from '@/components/shared';
import TranslationCell from './TranslationCell';
import TranslationDrawer from './TranslationDrawer';

type TranslationWorkspaceProps = {
  slug: string;
  projectId: string;
  canEdit: boolean;
  canUpdateProject: boolean;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const TranslationWorkspace = ({
  slug,
  projectId,
  canEdit,
  canUpdateProject,
}: TranslationWorkspaceProps) => {
  const { t } = useTranslation('common');
  const filters: Array<{ id: TranslationFilter; label: string }> = [
    { id: 'all', label: t('translation-filter-all') },
    { id: 'ai', label: t('translation-filter-ai') },
    { id: 'manual', label: t('translation-filter-manual') },
    {
      id: 'needs-review',
      label: t('translation-filter-needs-review'),
    },
    { id: 'missing', label: t('translation-filter-missing') },
  ];
  const [filter, setFilter] = useState<TranslationFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const workspace = useTranslationWorkspace(slug, projectId, {
    page,
    pageSize,
    filter,
    search: debouncedSearch,
  });
  const [selected, setSelected] = useState<{
    keyId: string;
    locale: string;
  } | null>(null);
  const [locale, setLocale] = useState('');
  const [fillLocale, setFillLocale] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const dashboard = workspace.dashboard;
  const rows = dashboard?.rows ?? [];
  const pagination = dashboard?.pagination;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter, pageSize]);

  const selectedRow = selected
    ? dashboard?.rows.find((row) => row.keyId === selected.keyId)
    : undefined;

  if (workspace.isLoading) {
    return <Loading />;
  }

  if (workspace.isError) {
    return <ErrorDisplay message={workspace.isError.message} />;
  }

  if (!dashboard) {
    return <ErrorDisplay message={t('translation-project-not-found')} />;
  }

  const run = async (
    action: () => Promise<{ filled: number; skipped: number }>,
    verb: string
  ) => {
    setIsRunning(true);
    try {
      const result = await action();
      toast.success(
        `${verb}: ${result.filled} filled, ${result.skipped} skipped`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setIsRunning(false);
    }
  };

  const addLocale = async (event: React.FormEvent) => {
    event.preventDefault();
    await run(async () => {
      const result = await workspace.addLocale(locale);
      return { filled: result.filled, skipped: result.skipped };
    }, 'Locale added');
    setLocale('');
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t('translation-workspace')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            {dashboard.project.name}
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            {t('source-locale')}: {dashboard.project.sourceLocale}
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          disabled={workspace.isRefreshing}
          onClick={workspace.refresh}
          type="button"
        >
          {t('refresh')}
        </button>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
        <label className="form-control min-w-64 flex-1">
          <span className="label-text mb-1">{t('search-translations')}</span>
          <input
            className="input input-bordered input-sm"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search…"
            type="search"
            value={search}
          />
        </label>

        {canUpdateProject && (
          <form className="flex items-end gap-2" onSubmit={addLocale}>
            <label className="form-control">
              <span className="label-text mb-1">{t('add-locale')}</span>
              <input
                className="input input-bordered input-sm w-32"
                maxLength={35}
                onChange={(event) => setLocale(event.target.value)}
                placeholder="fr"
                required
                value={locale}
              />
            </label>
            <button
              className="btn btn-primary btn-sm"
              disabled={isRunning}
              type="submit"
            >
              {t('add')}
            </button>
          </form>
        )}

        {canEdit && dashboard.locales.length > 1 && (
          <div className="flex items-end gap-2">
            <label className="form-control">
              <span className="label-text mb-1">
                {t('fill-missing-locale')}
              </span>
              <select
                className="select select-bordered select-sm"
                onChange={(event) => setFillLocale(event.target.value)}
                value={fillLocale}
              >
                <option value="">{t('choose-locale')}</option>
                {dashboard.locales
                  .filter(
                    (projectLocale) =>
                      projectLocale !== dashboard.project.sourceLocale
                  )
                  .map((projectLocale) => (
                    <option key={projectLocale} value={projectLocale}>
                      {projectLocale}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="btn btn-outline btn-primary btn-sm"
              disabled={!fillLocale || isRunning}
              onClick={() =>
                run(
                  () => workspace.fillMissing(fillLocale),
                  'Missing translations filled'
                )
              }
              type="button"
            >
              {t('fill')}
            </button>
          </div>
        )}
      </div>

      <nav className="tabs tabs-bordered overflow-x-auto">
        {filters.map((item) => (
          <button
            className={`tab whitespace-nowrap ${
              filter === item.id ? 'tab-active' : ''
            }`}
            key={item.id}
            onClick={() => {
              setFilter(item.id);
              setPage(1);
            }}
            type="button"
          >
            {item.label}
            <span className="badge badge-ghost badge-sm ml-2">
              {dashboard.counts[item.id]}
            </span>
          </button>
        ))}
      </nav>

      <div className="overflow-auto rounded-lg border border-base-300 bg-base-100">
        <table className="table-pin-rows table-pin-cols table">
          <thead>
            <tr>
              <th className="min-w-64 bg-base-200">{t('translation-key')}</th>
              {dashboard.locales.map((projectLocale) => (
                <th className="min-w-72 bg-base-200" key={projectLocale}>
                  {projectLocale}
                  {projectLocale === dashboard.project.sourceLocale && (
                    <span className="badge badge-primary badge-sm ml-2">
                      {t('source')}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: DashboardRow) => (
              <tr key={row.keyId}>
                <th className="max-w-72 align-top">
                  <p className="break-words font-mono text-xs font-normal">
                    {row.key}
                  </p>
                  <p className="mt-2 line-clamp-3 whitespace-normal text-xs font-normal text-base-content/60">
                    {row.sourceText}
                  </p>
                </th>
                {dashboard.locales.map((projectLocale) => (
                  <td className="p-0 align-top" key={projectLocale}>
                    <TranslationCell
                      canEdit={canEdit}
                      cell={row.cells[projectLocale]}
                      fallbackValue={
                        projectLocale === dashboard.project.sourceLocale
                          ? row.sourceText
                          : undefined
                      }
                      onOpen={() =>
                        setSelected({
                          keyId: row.keyId,
                          locale: projectLocale,
                        })
                      }
                      onSave={(value) =>
                        workspace.saveManual({
                          keyId: row.keyId,
                          locale: projectLocale,
                          value,
                        })
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  className="py-12 text-center text-base-content/60"
                  colSpan={dashboard.locales.length + 1}
                >
                  {t('no-matching-translations')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalKeys > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-base-content/60">
            {t('translation-pagination-summary', {
              from: (pagination.page - 1) * pagination.pageSize + 1,
              to: Math.min(
                pagination.page * pagination.pageSize,
                pagination.totalKeys
              ),
              total: pagination.totalKeys,
            })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span>{t('rows-per-page')}</span>
              <select
                className="select select-bordered select-sm"
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                value={pageSize}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <div className="join">
              <button
                className="btn btn-sm join-item"
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                {t('previous')}
              </button>
              <span className="btn btn-sm join-item pointer-events-none">
                {t('page-of', {
                  page: pagination.page,
                  pages: pagination.totalPages,
                })}
              </span>
              <button
                className="btn btn-sm join-item"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1)
                  )
                }
                type="button"
              >
                {t('next')}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && selectedRow && (
        <TranslationDrawer
          actions={workspace}
          canEdit={canEdit}
          locale={selected.locale}
          onClose={() => setSelected(null)}
          row={selectedRow}
          sourceLocale={dashboard.project.sourceLocale}
        />
      )}
    </div>
  );
};

export default TranslationWorkspace;
