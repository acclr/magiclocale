import {
  paginateTranslationDashboard,
  type TranslationFilter,
} from '../../domain/translations';
import { getLocaleDisplay } from '../../domain/translations';
import useBulkSelection from '../../hooks/useBulkSelection';
import useCanAccess from '../../hooks/useCanAccess';
import useToggleList from '../../hooks/useToggleList';
import useTranslationQueue from '../../hooks/useTranslationQueue';
import useTranslationWorkspace from '../../hooks/useTranslationWorkspace';
import { useProjectEnvironment } from '../../hooks/useProjectEnvironment';
import { useTranslation } from '@/hooks/useTranslation';
import { subscribeSourceKeyLimit } from '@/lib/keykit-source-key-limit';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { Error as ErrorDisplay } from '@/components/shared';
import { WorkspaceToolbarPortal } from '@/components/shared/shell/WorkspaceToolbarSlot';
import { CellDraftsProvider } from './CellDrafts';
import LocaleSelect from './LocaleSelect';
import TranslationDrawer from './TranslationDrawer';
import TranslationGrid from './TranslationGrid';
import CollapsibleSearch from './workflow/CollapsibleSearch';
import NextStepButton from './workflow/NextStepButton';
import TranslateMenu from './workflow/TranslateMenu';

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
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { environment } = useProjectEnvironment();
  const workspace = useTranslationWorkspace(slug, projectId, {
    environment,
  });
  const [selected, setSelected] = useState<{
    keyId: string;
    locale: string;
  } | null>(null);
  const [locale, setLocale] = useState('');
  const [fillLocale, setFillLocale] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const dashboard = workspace.dashboard;
  const view = useMemo(
    () =>
      dashboard
        ? paginateTranslationDashboard(dashboard, {
            page,
            pageSize,
            filter,
            search: deferredSearch,
          })
        : null,
    [dashboard, deferredSearch, filter, page, pageSize]
  );
  const rows = view?.rows ?? [];
  const pagination = view?.pagination;

  useEffect(() => {
    return subscribeSourceKeyLimit((message) => {
      toast.error(message, { id: 'source-key-limit', duration: 8000 });
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filter, pageSize]);

  const keySelection = useBulkSelection({
    pageIds: rows.map((row) => row.keyId),
    totalMatching: pagination?.totalKeys ?? 0,
    resetKey: [search, filter, pageSize, projectId, environment].join('|'),
  });
  const localeSelection = useToggleList<string>();
  const translationQueue = useTranslationQueue({
    queueTranslations: workspace.queueTranslations,
    keys: keySelection,
    locales: localeSelection.items,
    filter,
    search: deferredSearch,
    onQueued: (result) =>
      toast.success(
        result.failed
          ? `${t('translation-queue-complete')}: ${result.filled} filled, ${result.skipped} skipped, ${result.failed} failed`
          : `${t('translation-queue-complete')}: ${result.filled} filled, ${result.skipped} skipped`
      ),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Request failed'),
  });

  const selectedRow = selected
    ? dashboard?.rows.find((row) => row.keyId === selected.keyId)
    : undefined;

  if (!dashboard && workspace.isLoading) {
    return <WorkspaceSkeleton />;
  }

  if (workspace.isError && !dashboard) {
    return <ErrorDisplay message={workspace.isError.message} />;
  }

  if (!dashboard || !view) {
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
      <WorkspaceToolbarPortal>
        <CollapsibleSearch onChange={setSearch} value={search} />
        {canEdit && keySelection.count > 0 ? (
          <TranslateMenu
            allMatching={keySelection.allMatching}
            keyCount={keySelection.count}
            locales={dashboard.locales}
            onClear={() => {
              keySelection.clear();
              localeSelection.clear();
            }}
            onMatchingScopeChange={keySelection.setMatchingScope}
            onQueue={(mode, fromLocale) =>
              void translationQueue.queue(mode, fromLocale)
            }
            onToggleLocale={localeSelection.toggle}
            pendingMode={translationQueue.pendingMode}
            selectedLocales={localeSelection.items}
            sourceLocale={dashboard.project.sourceLocale}
            totalMatching={keySelection.totalMatching}
          />
        ) : null}
        <NextStepButton
          canPublish={canAccess('team_version', ['publish'])}
          environmentName={dashboard.environment.name}
          onDraftsSaved={workspace.refresh}
          onPublish={(message) => workspace.publish(message)}
          publishState={dashboard.publishState}
        />
      </WorkspaceToolbarPortal>
      <div className="space-y-4">
        <div className="hidden flex flex-wrap items-end gap-3 rounded-lg bg-card p-3">
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

        <nav className="w-full tabs tabs-bordered overflow-x-auto">
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

        <TranslationGrid
          canEdit={canEdit}
          isRefreshing={workspace.isRefreshing}
          keySelection={
            canEdit
              ? {
                  allSelected: keySelection.allPageSelected,
                  someSelected: keySelection.somePageSelected,
                  isSelected: keySelection.isSelected,
                  toggle: keySelection.toggle,
                  togglePage: keySelection.togglePage,
                }
              : undefined
          }
          localeSelection={
            canEdit
              ? {
                  isSelected: localeSelection.has,
                  toggle: localeSelection.toggle,
                }
              : undefined
          }
          locales={dashboard.locales}
          onOpenCell={(keyId, projectLocale) =>
            setSelected({ keyId, locale: projectLocale })
          }
          onSaveCell={(keyId, projectLocale, value, options) =>
            workspace.saveManual(
              { keyId, locale: projectLocale, value },
              options
            )
          }
          rows={rows}
          sourceLocale={dashboard.project.sourceLocale}
        />

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
                <select
                  className="select select-bordered select-sm"
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  value={pageSize}
                  aria-label={`${pageSize} / ${t('page')}`}
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
    </CellDraftsProvider>
  );
};

function WorkspaceSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-10 w-48 animate-pulse rounded-md bg-card" />
      <div className="h-8 w-full animate-pulse rounded-md bg-card" />
      <div className="space-y-2 rounded-lg bg-card p-3">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            className="h-12 animate-pulse rounded-md bg-elevated"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

export default TranslationWorkspace;
