import { useKeykit } from '@keykithq/sdk/react';
import { cn } from 'cn';
import { useMemo } from 'react';

import type { HeroDemoPhase } from '@/domain/landing/hero-demo';
import {
  filterDashboardRows,
  type DashboardRow,
  type TranslationFilter,
} from '@/domain/translations';
import { CellDraftsProvider } from '@/components/translations/CellDrafts';
import LocaleName from '@/components/translations/LocaleName';
import TranslationGrid from '@/components/translations/TranslationGrid';

type HeroTranslationEditorProps = {
  projectName: string;
  locales: string[];
  sourceLocale: string;
  rows: DashboardRow[];
  phase: HeroDemoPhase;
  highlightKeyId: string;
};

const TABS: Array<{ id: TranslationFilter; key: string; fallback: string }> = [
  { id: 'all', key: 'landing.hero.demo.filter-all', fallback: 'All' },
  { id: 'ai', key: 'landing.hero.demo.filter-ai', fallback: 'AI' },
  { id: 'manual', key: 'landing.hero.demo.filter-manual', fallback: 'Manual' },
  {
    id: 'missing',
    key: 'landing.hero.demo.filter-missing',
    fallback: 'Missing',
  },
];

const noop = () => undefined;
const resolveSave = () => Promise.resolve();

const HeroTranslationEditor = ({
  projectName,
  locales,
  sourceLocale,
  rows,
  phase,
  highlightKeyId,
}: HeroTranslationEditorProps) => {
  const { translate } = useKeykit();
  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [
          tab.id,
          filterDashboardRows(rows, { filter: tab.id }).length,
        ])
      ) as Record<TranslationFilter, number>,
    [rows]
  );
  const status = {
    idle: null,
    typing: null,
    syncing: {
      tone: 'muted',
      label: translate('landing.hero.demo.status-syncing', 'Scanning code…'),
    },
    discovered: {
      tone: 'primary',
      label: translate('landing.hero.demo.status-discovered', '1 new key'),
    },
    translating: {
      tone: 'ai',
      label: translate(
        'landing.hero.demo.status-translating',
        'Translating with AI…'
      ),
    },
    translated: {
      tone: 'done',
      label: translate(
        'landing.hero.demo.status-translated',
        'Translated · ready to publish'
      ),
    },
  }[phase];

  return (
    <CellDraftsProvider>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm font-medium tracking-tight">
            <span>{projectName}</span>
            <LocaleName code={sourceLocale} variant="full" />
          </div>
          <span className="badge badge-ghost">
            {translate('landing.hero.demo.environment', 'Development')}
          </span>
          <div className="ml-auto flex h-6 items-center">
            {status && (
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-300',
                  status.tone === 'muted' &&
                    'border-border text-muted-foreground',
                  status.tone === 'primary' &&
                    'border-primary/30 bg-primary/10 text-primary',
                  status.tone === 'ai' &&
                    'border-sky-400/30 bg-sky-400/10 text-sky-300',
                  status.tone === 'done' &&
                    'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                )}
                key={phase}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full bg-current',
                    status.tone !== 'done' && 'animate-pulse'
                  )}
                />
                {status.label}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 p-3 sm:p-4">
          <nav className="tabs w-full overflow-x-auto sm:w-fit">
            {TABS.map((tab, index) => (
              <span
                className={cn(
                  'tab whitespace-nowrap',
                  index === 0 && 'tab-active'
                )}
                key={tab.id}
              >
                {translate(tab.key, tab.fallback)}
                <span className="badge badge-ghost badge-sm ml-2 tabular-nums">
                  {counts[tab.id]}
                </span>
              </span>
            ))}
          </nav>

          <TranslationGrid
            canEdit
            className="hero-grid-fade"
            locales={locales}
            onOpenCell={noop}
            onSaveCell={resolveSave}
            rowClassName={(row) =>
              row.keyId === highlightKeyId
                ? 'hero-row-enter bg-primary/[0.06] odd:bg-primary/[0.06] shadow-[inset_2px_0_0_var(--primary)] [&_textarea]:opacity-100'
                : undefined
            }
            rows={rows}
            sourceLocale={sourceLocale}
          />
        </div>
      </div>
    </CellDraftsProvider>
  );
};

export default HeroTranslationEditor;
