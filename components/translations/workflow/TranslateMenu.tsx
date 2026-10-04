import { getLocaleDisplay } from '../../../domain/translations';
import { useTranslation } from '@/hooks/useTranslation';
import type { QueueMode } from '../../../hooks/useTranslationQueue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDownIcon,
  RefreshCwIcon,
  SparklesIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';

import LocaleName from '../LocaleName';
import RetranslateConfirmDialog from './RetranslateConfirmDialog';

export type TranslateMenuProps = {
  keyCount: number;
  allMatching: boolean;
  totalMatching: number;
  onMatchingScopeChange: (all: boolean) => void;
  locales: string[];
  sourceLocale: string;
  selectedLocales: string[];
  onToggleLocale: (locale: string) => void;
  onQueue: (mode: QueueMode, fromLocale?: string) => void;
  onClear: () => void;
  pendingMode: QueueMode | null;
};

const keepOpen = (event: Event) => event.preventDefault();

/** Every bulk-translate choice behind one button: scope, languages, mode. */
const TranslateMenu = ({
  keyCount,
  allMatching,
  totalMatching,
  onMatchingScopeChange,
  locales,
  sourceLocale,
  selectedLocales,
  onToggleLocale,
  onQueue,
  onClear,
  pendingMode,
}: TranslateMenuProps) => {
  const { t } = useTranslation('common');
  const [retranslateFrom, setRetranslateFrom] = useState<string | null>(null);
  const targetLocales = locales.filter((locale) => locale !== sourceLocale);
  const hasLocales = selectedLocales.length > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={pendingMode !== null} type="button">
            {pendingMode ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <SparklesIcon data-icon="inline-start" />
            )}
            {t('translate-selected', { count: keyCount })}
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto min-w-60">
          {totalMatching > keyCount || allMatching ? (
            <DropdownMenuCheckboxItem
              checked={allMatching}
              onCheckedChange={(checked) =>
                onMatchingScopeChange(checked === true)
              }
              onSelect={keepOpen}
            >
              {t('select-all-matching-keys', { count: totalMatching })}
            </DropdownMenuCheckboxItem>
          ) : null}

          <DropdownMenuLabel>{t('translate-into')}</DropdownMenuLabel>
          {targetLocales.map((locale) => {
            const display = getLocaleDisplay(locale);
            return (
              <DropdownMenuCheckboxItem
                checked={selectedLocales.includes(locale)}
                key={locale}
                onCheckedChange={() => onToggleLocale(locale)}
                onSelect={keepOpen}
              >
                <LocaleName code={locale} option={display} />
                {display.label}
              </DropdownMenuCheckboxItem>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!hasLocales}
            onSelect={() => onQueue('fill-missing')}
          >
            <SparklesIcon />
            {t('queue-translations')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasLocales}
            onSelect={() => setRetranslateFrom(sourceLocale)}
          >
            <RefreshCwIcon />
            {t('queue-retranslate')}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onClear}>
            <XIcon />
            {t('clear-selection')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RetranslateConfirmDialog
        fromLocale={retranslateFrom}
        keyCount={keyCount}
        locales={selectedLocales}
        onCancel={() => setRetranslateFrom(null)}
        onConfirm={(fromLocale) => {
          setRetranslateFrom(null);
          onQueue('retranslate', fromLocale);
        }}
        sourceChoices={locales}
      />
    </>
  );
};

export default TranslateMenu;
