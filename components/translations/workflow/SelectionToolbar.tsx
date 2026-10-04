import { getLocaleDisplay } from '../../../domain/translations';
import { useTranslation } from '@/hooks/useTranslation';
import type { QueueMode } from '../../../hooks/useTranslationQueue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from 'cn';
import {
  ChevronDownIcon,
  RefreshCwIcon,
  SparklesIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';

import LocaleName from '../LocaleName';
import RetranslateConfirmDialog from './RetranslateConfirmDialog';

export type SelectionToolbarProps = {
  keyCount: number;
  allMatching: boolean;
  locales: string[];
  sourceLocale: string;
  selectedLocales: string[];
  onToggleLocale: (locale: string) => void;
  onClear: () => void;
  onQueue: (mode: QueueMode, fromLocale?: string) => void;
  pendingMode: QueueMode | null;
  canQueue: boolean;
};

/**
 * One-line contextual bar shown in place of the filter tabs while keys or
 * languages are selected: what is selected, which languages, and the actions.
 */
const SelectionToolbar = ({
  keyCount,
  allMatching,
  locales,
  sourceLocale,
  selectedLocales,
  onToggleLocale,
  onClear,
  onQueue,
  pendingMode,
  canQueue,
}: SelectionToolbarProps) => {
  const { t } = useTranslation('common');
  const [retranslateFrom, setRetranslateFrom] = useState<string | null>(null);
  const targetLocales = locales.filter((locale) => locale !== sourceLocale);

  const summary = !keyCount
    ? t('queue-hint-select-keys')
    : allMatching
      ? t('all-matching-keys-selected', { count: keyCount })
      : t('keys-selected', { count: keyCount });

  return (
    <div
      aria-label={t('bulk-translate')}
      className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-accent/40 bg-accent/5 px-2 py-1.5"
      role="toolbar"
    >
      <Button
        aria-label={t('clear-selection')}
        onClick={onClear}
        size="icon-sm"
        title={t('clear-selection')}
        type="button"
        variant="ghost"
      >
        <XIcon />
      </Button>
      <span aria-live="polite" className="text-sm font-medium">
        {summary}
      </span>

      <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-xs text-muted-foreground">
          {keyCount && !selectedLocales.length
            ? t('queue-hint-select-locales')
            : t('translate-into')}
        </span>
        {targetLocales.map((locale) => {
          const display = getLocaleDisplay(locale);
          const active = selectedLocales.includes(locale);
          return (
            <button
              aria-pressed={active}
              className={cn(
                'inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs transition-colors',
                active
                  ? 'border-accent/60 bg-accent/20 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              key={locale}
              onClick={() => onToggleLocale(locale)}
              title={display.label}
              type="button"
            >
              <LocaleName code={locale} option={display} />
              <span className="font-mono">{locale}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {locales.length > 1 && (
          <div className="flex items-center">
            <Button
              className="rounded-r-none"
              disabled={!canQueue}
              onClick={() => setRetranslateFrom(sourceLocale)}
              size="sm"
              type="button"
            >
              {pendingMode === 'retranslate' ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RefreshCwIcon data-icon="inline-start" />
              )}
              {t('queue-retranslate')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  aria-label={t('retranslate-from')}
                  className="rounded-l-none border-l border-primary-foreground/20 px-1.5"
                  disabled={!canQueue}
                  size="sm"
                  type="button"
                >
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {t('retranslate-from')}
                </DropdownMenuLabel>
                {locales.map((locale) => {
                  const display = getLocaleDisplay(locale);
                  return (
                    <DropdownMenuItem
                      key={locale}
                      onSelect={() => {
                        window.setTimeout(() => setRetranslateFrom(locale), 0);
                      }}
                    >
                      <LocaleName code={locale} option={display} />
                      <span className="flex-1">{display.label}</span>
                      {locale === sourceLocale && (
                        <span className="text-xs text-muted-foreground">
                          {t('source')}
                        </span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <Button
          disabled={!canQueue}
          onClick={() => onQueue('fill-missing')}
          size="sm"
          type="button"
          variant="outline"
        >
          {pendingMode === 'fill-missing' ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <SparklesIcon data-icon="inline-start" />
          )}
          {t('queue-translations')}
        </Button>
      </div>

      <RetranslateConfirmDialog
        fromLocale={retranslateFrom}
        keyCount={keyCount}
        locales={selectedLocales}
        sourceChoices={locales}
        onCancel={() => setRetranslateFrom(null)}
        onConfirm={(fromLocale) => {
          setRetranslateFrom(null);
          onQueue('retranslate', fromLocale);
        }}
      />
    </div>
  );
};

export default SelectionToolbar;
