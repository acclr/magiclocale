import type {
  TranslationFilter,
  DashboardRow,
} from '../../domain/translations';
import { getLocaleDisplay, localeColor } from '../../domain/translations';
import useCanAccess from '../../hooks/useCanAccess';
import useTranslationWorkspace from '../../hooks/useTranslationWorkspace';
import { useProjectEnvironment } from '../../hooks/useProjectEnvironment';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Error as ErrorDisplay, Loading } from '@/components/shared';
import { CellDraftsProvider } from './CellDrafts';
import LocaleName from './LocaleName';
import LocaleSelect from './LocaleSelect';
import TranslationCell from './TranslationCell';
import TranslationDrawer from './TranslationDrawer';
import TranslationSaveBar from './TranslationSaveBar';
import PublishBar from '../versions/PublishBar';

function getLanguageName(locale) {
  const code = new Intl.Locale(locale).language;

  return new Intl.DisplayNames([code], {
    type: 'language',
  }).of(code);
}

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
  const { canAccess } = useCanAccess();
  const filters: Array<{ id: TranslationFilter; label: string }> = [
    { id: 'all', label: t('translation-filter-all') },
    { id: 'ai', label: t('translation-filter-ai') },
    { id: 'manual', label: t('translation-filter-manual') },
    {
      id: 'needs-review',
      label: t('translation-filter-needs-review'),
    },
    { id: 'missing', label: t('translation-filter-missing') },
    { id: 'unused', label: t('translation-filter-unused') },
    { id: 'deprecated', label: t('translation-filter-deprecated') },
  ];
  const [filter, setFilter] = useState<TranslationFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { environment } = useProjectEnvironment();
  const workspace = useTranslationWorkspace(slug, projectId, {
    page,
    pageSize,
    filter,
    search: debouncedSearch,
    environment,
  });
  const [selected, setSelected] = useState<{
    keyId: string;
    locale: string;
  } | null>(null);
  const [locale, setLocale] = useState('');
  const [fillLocale, setFillLocale] = useState('');
  const [fromLocale, setFromLocale] = useState('');
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([]);
  const [selectAllMatching, setSelectAllMatching] = useState(false);
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

  useEffect(() => {
    setSelectedKeyIds([]);
    setSelectAllMatching(false);
  }, [debouncedSearch, filter, pageSize, projectId, environment]);

  useEffect(() => {
    if (dashboard?.project.sourceLocale) {
      setFromLocale(dashboard.project.sourceLocale);
    }
  }, [dashboard?.project.id, dashboard?.project.sourceLocale]);

  const selectedRow = selected
    ? dashboard?.rows.find((row) => row.keyId === selected.keyId)
    : undefined;

  const pageKeyIds = rows.map((row) => row.keyId);
  const allPageKeysSelected =
    selectAllMatching ||
    (pageKeyIds.length > 0 &&
      pageKeyIds.every((keyId) => selectedKeyIds.includes(keyId)));
  const somePageKeysSelected =
    !selectAllMatching &&
    pageKeyIds.some((keyId) => selectedKeyIds.includes(keyId)) &&
    !pageKeyIds.every((keyId) => selectedKeyIds.includes(keyId));
  const keySelectionCount = selectAllMatching
    ? (pagination?.totalKeys ?? 0)
    : selectedKeyIds.length;
  const hasKeySelection = selectAllMatching || selectedKeyIds.length > 0;
  const canQueue =
    canEdit && hasKeySelection && selectedLocales.length > 0 && !isRunning;

  const togglePageKeys = () => {
    if (selectAllMatching) {
      setSelectAllMatching(false);
      setSelectedKeyIds([]);
      return;
    }
    if (pageKeyIds.every((keyId) => selectedKeyIds.includes(keyId))) {
      setSelectedKeyIds((current) =>
        current.filter((keyId) => !pageKeyIds.includes(keyId))
      );
      return;
    }
    setSelectedKeyIds((current) =>
      Array.from(new Set([...current, ...pageKeyIds]))
    );
  };

  const toggleKey = (keyId: string) => {
    if (selectAllMatching) {
      setSelectAllMatching(false);
      setSelectedKeyIds(pageKeyIds.filter((id) => id !== keyId));
      return;
    }
    setSelectedKeyIds((current) =>
      current.includes(keyId)
        ? current.filter((item) => item !== keyId)
        : [...current, keyId]
    );
  };

  const queueSelected = async (mode: 'fill-missing' | 'retranslate') => {
    if (mode === 'retranslate') {
      const confirmed = window.confirm(
        t('confirm-queue-retranslate', {
          keys: String(keySelectionCount),
          locales: selectedLocales.join(', '),
          from: fromLocale.trim(),
        })
      );
      if (!confirmed) {
        return;
      }
    }
    await run(
      async () => {
        const result = await workspace.queueTranslations({
          scope: selectAllMatching ? 'all-matching' : 'selected-keys',
          keyIds: selectAllMatching ? undefined : selectedKeyIds,
          locales: selectedLocales,
          mode,
          sourceLocale: mode === 'retranslate' ? fromLocale.trim() : undefined,
          filter,
          search: debouncedSearch,
        });
        setSelectedKeyIds([]);
        setSelectAllMatching(false);
        return {
          filled: result.filled,
          skipped: result.skipped,
          failed: result.failed,
        };
      },
      t('translation-queue-complete', { queued: String(keySelectionCount) })
    );
  };

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
    action: () => Promise<{
      filled: number;
      skipped: number;
      failed?: number;
    }>,
    verb: string
  ) => {
    setIsRunning(true);
    try {
      const result = await action();
      const failed = result.failed ?? 0;
      toast.success(
        failed
          ? `${verb}: ${result.filled} filled, ${result.skipped} skipped, ${failed} failed`
          : `${verb}: ${result.filled} filled, ${result.skipped} skipped`
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
    <CellDraftsProvider>
      <div className="space-y-4 pb-28">
        <PublishBar
          canPublish={canAccess('team_version', ['publish'])}
          environmentName={dashboard.environment.name}
          onPublish={(message) => workspace.publish(message)}
          publishState={dashboard.publishState}
        />

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-row items-center text-2xl font-semibold">
              <h1 className="mr-2.5">{dashboard.project.name}</h1>
              <LocaleName
                code={dashboard.project.sourceLocale}
                variant="full"
              />
            </div>
          </div>

          <div className="min-w-64 ml-auto">
            <input
              className="input input-bordered input-sm"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('search-translations')}
              type="search"
              value={search}
            />
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

        <div className="hidden flex flex-wrap items-end gap-3 rounded-md bg-card p-3">
          {canUpdateProject && (
            <form className="flex items-end gap-2" onSubmit={addLocale}>
              <label className="form-control min-w-64">
                <span className="label-text mb-1">{t('add-locale')}</span>
                <LocaleSelect
                  exclude={dashboard.locales}
                  format={dashboard.project.localeFormat}
                  onChange={setLocale}
                  required
                  value={locale}
                />
              </label>
              <button
                className="btn btn-primary btn-sm"
                disabled={isRunning || !locale}
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
                    .map((projectLocale) => {
                      const display = getLocaleDisplay(projectLocale);
                      return (
                        <option key={projectLocale} value={projectLocale}>
                          {display.flag} {display.label}
                        </option>
                      );
                    })}
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

        {canEdit && (
          <div className="flex hidden flex-wrap items-end gap-3 rounded-md bg-card p-3">
            <p className="w-full text-sm text-muted-foreground">
              {t('retranslate-help')}
            </p>
            <label className="form-control min-w-64">
              <span className="label-text mb-1">{t('retranslate-from')}</span>
              <LocaleSelect
                format="any"
                onChange={setFromLocale}
                required
                value={fromLocale}
              />
            </label>
            <button
              className="btn btn-outline btn-sm"
              disabled={
                !selectedLocales.length || !fromLocale.trim() || isRunning
              }
              onClick={() => {
                if (
                  !window.confirm(
                    t('confirm-retranslate', {
                      locales: selectedLocales.join(', '),
                      from: fromLocale.trim(),
                    })
                  )
                ) {
                  return;
                }
                void run(
                  () =>
                    workspace.retranslate(selectedLocales, fromLocale.trim()),
                  'Retranslated'
                );
              }}
              type="button"
            >
              {t('retranslate-selected')}
              {selectedLocales.length ? ` (${selectedLocales.length})` : ''}
            </button>
          </div>
        )}

        {canEdit && (
          <div className="rounded-md bg-card p-3 text-sm text-muted-foreground">
            {t('translation-queue-help')}
          </div>
        )}

        <section className="flex flex-row items-center justify-between gap-4">
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
        </section>

        <div className="rounded-[8px] overflow-hidden relative border border-[#dddddd22] bg-card">
          <div className="flex w-full max-w-full relative overflow-auto">
            <table className="table-pin-rows min-w-max table-pin-cols table [&_td]:border-l [&_td]:border-[#ffffff11] [&_th]:border-l [&_th]:border-[#ffffff11] [&_th:first-child]:border-l-0">
              <thead className="sticky top-0">
                <tr>
                  {canEdit && (
                    <th className="w-10 bg-card px-2 py-2.5">
                      <input
                        aria-label={t('select-keys-on-page')}
                        checked={allPageKeysSelected}
                        className="checkbox checkbox-sm"
                        onChange={togglePageKeys}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = somePageKeysSelected;
                          }
                        }}
                        type="checkbox"
                      />
                    </th>
                  )}
                  <th className="min-w-64 bg-card px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{t('translation-key')}</span>
                      {canEdit && pagination && pagination.totalKeys > 0 && (
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => {
                            setSelectedKeyIds([]);
                            setSelectAllMatching(true);
                          }}
                          type="button"
                        >
                          {t('select-all-matching-keys', {
                            count: pagination.totalKeys,
                          })}
                        </button>
                      )}
                    </div>
                  </th>
                  {dashboard.locales.map((projectLocale) => {
                    const color = localeColor(projectLocale);
                    const display = getLocaleDisplay(projectLocale);
                    return (
                      <th
                        className="min-w-72 px-3 py-2.5"
                        key={projectLocale}
                        style={{
                          backgroundColor: color.background,
                        }}
                        title={display.label}
                      >
                        <label className="flex items-center gap-2">
                          {canEdit && (
                            <input
                              checked={selectedLocales.includes(projectLocale)}
                              className="checkbox checkbox-sm"
                              onChange={() =>
                                setSelectedLocales((current) =>
                                  current.includes(projectLocale)
                                    ? current.filter(
                                        (locale) => locale !== projectLocale
                                      )
                                    : [...current, projectLocale]
                                )
                              }
                              type="checkbox"
                            />
                          )}
                          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold">
                            <LocaleName code={projectLocale} option={display} />
                            <span className="ml-1">
                              {getLanguageName(
                                projectLocale
                              )?.[0].toUpperCase() +
                                (getLanguageName(projectLocale)?.slice(1) ??
                                  '')}
                            </span>
                          </span>
                          {projectLocale === dashboard.project.sourceLocale && (
                            <span className="badge badge-sm">
                              {t('source')}
                            </span>
                          )}
                        </label>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: DashboardRow) => (
                  <tr key={row.keyId} className="odd:bg-foreground/5">
                    {canEdit && (
                      <td className="w-10 px-2 py-2.5 align-top">
                        <input
                          aria-label={t('select-key', { key: row.key })}
                          checked={
                            selectAllMatching ||
                            selectedKeyIds.includes(row.keyId)
                          }
                          className="checkbox checkbox-sm"
                          onChange={() => toggleKey(row.keyId)}
                          type="checkbox"
                        />
                      </td>
                    )}
                    <th className="max-w-72 px-3 py-2.5 align-top">
                      <p className="break-words font-mono text-xs font-normal">
                        {row.key}
                      </p>
                      {/*<p className="mt-2 line-clamp-3 whitespace-normal text-xs font-normal text-muted-foreground">
                        {row.sourceText}
                      </p>*/}
                    </th>
                    {dashboard.locales.map((projectLocale) => {
                      const color = localeColor(projectLocale);
                      return (
                        <td
                          className="relative z-0 h-20 overflow-visible p-0 align-top focus-within:z-30"
                          key={projectLocale}
                          style={{
                            backgroundColor: color.background,
                          }}
                        >
                          <TranslationCell
                            canEdit={canEdit}
                            cell={row.cells[projectLocale]}
                            fallbackValue={
                              projectLocale === dashboard.project.sourceLocale
                                ? row.sourceText
                                : undefined
                            }
                            keyId={row.keyId}
                            onOpen={() =>
                              setSelected({
                                keyId: row.keyId,
                                locale: projectLocale,
                              })
                            }
                            onSave={(value, options) =>
                              workspace.saveManual(
                                {
                                  keyId: row.keyId,
                                  locale: projectLocale,
                                  value,
                                },
                                options
                              )
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td
                      className="py-12 text-center text-muted-foreground"
                      colSpan={dashboard.locales.length + 1 + (canEdit ? 1 : 0)}
                    >
                      {t('no-matching-translations')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pagination && pagination.totalKeys > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
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
        {canEdit && hasKeySelection && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium">
                  {t('translation-queue-selection', {
                    keys: keySelectionCount,
                    locales: selectedLocales.length
                      ? selectedLocales.join(', ')
                      : t('translation-queue-no-locales'),
                  })}
                </p>
                {selectAllMatching && (
                  <p className="text-muted-foreground">
                    {t('translation-queue-all-matching')}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSelectedKeyIds([]);
                    setSelectAllMatching(false);
                  }}
                  type="button"
                >
                  {t('clear-selection')}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!canQueue}
                  onClick={() => void queueSelected('fill-missing')}
                  type="button"
                >
                  {t('queue-translations')}
                </button>
                {dashboard.locales.length > 1 && (
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={!canQueue || !fromLocale.trim()}
                    onClick={() => void queueSelected('retranslate')}
                    type="button"
                  >
                    {t('queue-retranslate')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <TranslationSaveBar onRefresh={workspace.refresh} />
      </div>
    </CellDraftsProvider>
  );
};

export default TranslationWorkspace;
