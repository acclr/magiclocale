import { extractVariableTokens } from '../../domain/keys';
import type { DashboardRow } from '../../domain/translations';
import { getLocaleDisplay, localeColor } from '../../domain/translations';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from 'cn';

import type { CellSaveOptions } from './CellDrafts';
import LocaleName from './LocaleName';
import TranslationCell from './TranslationCell';
import { VariableToken } from './VariableText';

export type GridKeySelection = {
  allSelected: boolean;
  someSelected: boolean;
  isSelected: (keyId: string) => boolean;
  toggle: (keyId: string) => void;
  togglePage: () => void;
};

export type GridLocaleSelection = {
  isSelected: (locale: string) => boolean;
  toggle: (locale: string) => void;
};

type TranslationGridProps = {
  locales: string[];
  sourceLocale: string;
  rows: DashboardRow[];
  canEdit: boolean;
  onOpenCell: (keyId: string, locale: string) => void;
  onSaveCell: (
    keyId: string,
    locale: string,
    value: string,
    options?: CellSaveOptions
  ) => Promise<unknown>;
  keySelection?: GridKeySelection;
  localeSelection?: GridLocaleSelection;
  isRefreshing?: boolean;
  rowClassName?: (row: DashboardRow) => string | undefined;
  className?: string;
};

function getLanguageName(locale: string) {
  const code = new Intl.Locale(locale).language;
  const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
  return name ? name[0].toUpperCase() + name.slice(1) : '';
}

const TranslationGrid = ({
  locales,
  sourceLocale,
  rows,
  canEdit,
  onOpenCell,
  onSaveCell,
  keySelection,
  localeSelection,
  isRefreshing = false,
  rowClassName,
  className,
}: TranslationGridProps) => {
  const { t } = useTranslation('common');

  return (
    <div
      aria-busy={isRefreshing}
      className={cn('relative overflow-hidden rounded-lg bg-card', className)}
    >
      {isRefreshing && (
        <div className="absolute inset-x-0 top-0 z-20 h-0.5 animate-pulse bg-primary" />
      )}
      <div className="relative flex w-full max-w-full overflow-auto">
        <table className="table-pin-rows table-pin-cols table min-w-max">
          <thead className="sticky top-0">
            <tr>
              {keySelection && (
                <th className="w-10 bg-card px-2 py-2.5">
                  <input
                    aria-label={t('select-keys-on-page')}
                    checked={keySelection.allSelected}
                    className="checkbox checkbox-sm"
                    onChange={keySelection.togglePage}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = keySelection.someSelected;
                      }
                    }}
                    type="checkbox"
                  />
                </th>
              )}
              <th className="min-w-64 bg-card px-3 py-2.5">
                <span>{t('translation-key')}</span>
              </th>
              {locales.map((projectLocale) => {
                const color = localeColor(projectLocale);
                const display = getLocaleDisplay(projectLocale);
                const isTarget = projectLocale !== sourceLocale;
                const localeSelected =
                  isTarget && localeSelection?.isSelected(projectLocale);
                return (
                  <th
                    className={cn(
                      'min-w-72 px-3 py-2.5',
                      localeSelected && 'ring-2 ring-accent ring-inset'
                    )}
                    key={projectLocale}
                    style={{ backgroundColor: color.background }}
                    title={display.label}
                  >
                    <div className="flex items-center gap-2">
                      {isTarget && localeSelection ? (
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            aria-label={t('select-locale', {
                              locale: display.label,
                            })}
                            checked={Boolean(localeSelected)}
                            className="checkbox checkbox-sm"
                            onChange={() =>
                              localeSelection.toggle(projectLocale)
                            }
                            type="checkbox"
                          />
                          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold">
                            <LocaleName code={projectLocale} option={display} />
                            <span className="ml-1">
                              {getLanguageName(projectLocale)}
                            </span>
                          </span>
                        </label>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold">
                          <LocaleName code={projectLocale} option={display} />
                          <span className="ml-1">
                            {getLanguageName(projectLocale)}
                          </span>
                        </span>
                      )}
                      {projectLocale === sourceLocale && (
                        <span className="badge badge-sm">{t('source')}</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const variables = extractVariableTokens(row.sourceText);
              return (
                <tr
                  key={row.keyId}
                  className={cn('odd:bg-foreground/5', rowClassName?.(row))}
                >
                  {keySelection && (
                    <td className="w-10 px-2 py-2.5 align-top">
                      <input
                        aria-label={t('select-key', { key: row.key })}
                        checked={keySelection.isSelected(row.keyId)}
                        className="checkbox checkbox-sm"
                        onChange={() => keySelection.toggle(row.keyId)}
                        type="checkbox"
                      />
                    </td>
                  )}
                  <th className="max-w-72 px-3 py-2.5 align-top">
                    <p className="break-words font-mono text-xs font-normal">
                      {row.key}
                    </p>
                    {variables.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {variables.map((variable) => (
                          <VariableToken
                            className="text-[10px]"
                            key={variable.name}
                            token={variable.token}
                          />
                        ))}
                      </div>
                    )}
                  </th>
                  {locales.map((projectLocale) => {
                    const color = localeColor(projectLocale);
                    return (
                      <td
                        className="relative z-0 h-20 overflow-visible p-0 align-top focus-within:z-30"
                        key={projectLocale}
                        style={{ backgroundColor: color.background }}
                      >
                        <TranslationCell
                          canEdit={canEdit}
                          cell={row.cells[projectLocale]}
                          fallbackValue={
                            projectLocale === sourceLocale
                              ? row.sourceText
                              : undefined
                          }
                          sourceText={row.sourceText}
                          keyId={row.keyId}
                          onOpen={() => onOpenCell(row.keyId, projectLocale)}
                          onSave={(value, options) =>
                            onSaveCell(row.keyId, projectLocale, value, options)
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td
                  className="py-12 text-center text-muted-foreground"
                  colSpan={locales.length + 1 + (keySelection ? 1 : 0)}
                >
                  {t('no-matching-translations')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TranslationGrid;
