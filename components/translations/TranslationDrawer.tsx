import type { DashboardRow } from '../../domain/translations';
import { localeColor } from '../../domain/translations';
import { extractVariableTokens, validateVariables } from '../../domain/keys';
import type { TranslationWorkspaceActions } from '../../hooks/useTranslationWorkspace';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import LocaleName from './LocaleName';
import StatusBadge from './StatusBadge';
import { VariableText } from './VariableText';

type TranslationDrawerProps = {
  row: DashboardRow;
  locale: string;
  sourceLocale: string;
  canEdit: boolean;
  actions: TranslationWorkspaceActions;
  onClose: () => void;
};

const TranslationDrawer = ({
  row,
  locale,
  sourceLocale,
  canEdit,
  actions,
  onClose,
}: TranslationDrawerProps) => {
  const { t } = useTranslation('common');
  const cell = row.cells[locale];
  const color = localeColor(locale);
  const [value, setValue] = useState(cell.value ?? '');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isSourceLocale = locale === sourceLocale;
  const variableIssues = validateVariables(row.sourceText, value);
  const sourceVariables = extractVariableTokens(row.sourceText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(cell.value ?? '');
    setSuggestion(null);
  }, [cell.value, locale, row.keyId]);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setIsPending(true);
    try {
      await action();
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setIsPending(false);
    }
  };

  const save = async () => {
    await run(
      () => actions.saveManual({ keyId: row.keyId, locale, value }),
      'Translation saved'
    );
  };

  const generateSuggestion = async () => {
    setIsPending(true);
    try {
      setSuggestion(await actions.suggest({ keyId: row.keyId, locale }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not generate suggestion'
      );
    } finally {
      setIsPending(false);
    }
  };

  const insertVariable = (token: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${token}${value.slice(end)}`;
    setValue(next);
    const cursor = start + token.length;
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(cursor, cursor);
    });
  };

  const acceptSuggestion = async () => {
    if (!suggestion) {
      return;
    }
    await run(
      () =>
        actions.acceptSuggestion({
          keyId: row.keyId,
          locale,
          value: suggestion,
        }),
      'Suggestion accepted'
    );
    setValue(suggestion);
    setSuggestion(null);
  };

  return (
    <div className="drawer drawer-end drawer-open fixed inset-0 z-50">
      <input className="drawer-toggle" type="checkbox" checked readOnly />
      <div className="drawer-side">
        <button
          aria-label="Close translation details"
          className="drawer-overlay"
          onClick={onClose}
          type="button"
        />
        <aside className="flex min-h-full w-full max-w-md flex-col border-l border-border bg-background">
          <header className="flex items-start justify-between p-5">
            <div>
              <h2 className="text-sm font-medium tracking-tight">
                <span
                  className="inline-flex items-center rounded px-2 py-0.5 text-base"
                  style={{
                    backgroundColor: color.hex,
                    color: color.onHex,
                  }}
                >
                  <LocaleName code={locale} variant="full" />
                </span>
              </h2>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {row.key}
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              {t('close')}
            </button>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t('source-text')} (
                <LocaleName code={sourceLocale} />)
              </p>
              <p className="mt-2 rounded-lg bg-muted p-3 text-sm">
                <VariableText text={row.sourceText} />
              </p>
              {sourceVariables.length ? (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {sourceVariables.map((variable) => (
                      <button
                        className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary hover:bg-primary/20"
                        disabled={!canEdit || isPending}
                        key={variable.name}
                        onClick={() => insertVariable(variable.token)}
                        type="button"
                      >
                        {variable.token}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('variable-placeholders-help')}
                  </p>
                </div>
              ) : null}
            </div>

            <label className="form-control">
              <span className="label">
                <span className="label-text font-semibold">
                  {t('locale-translation', { locale })}
                </span>
                <StatusBadge
                  missing={cell.missing}
                  source={cell.source}
                  status={cell.status}
                />
              </span>
              <textarea
                className="textarea textarea-bordered min-h-32"
                disabled={!canEdit || isPending}
                onChange={(event) => setValue(event.target.value)}
                ref={textareaRef}
                value={value}
              />
              {cell.aiLocked && (
                <span className="label-text-alt mt-2">
                  {t('human-owned-translation-help')}
                </span>
              )}
            </label>
            {variableIssues.length ? (
              <div className="alert alert-warning text-sm">
                {variableIssues.map((issue) => (
                  <p key={`${issue.kind}-${issue.name}`}>
                    {issue.kind === 'missing'
                      ? t('variable-missing', { name: issue.token })
                      : t('variable-unexpected', { name: issue.token })}
                  </p>
                ))}
              </div>
            ) : null}

            {cell.status === 'needs-review' && (
              <div className="alert alert-warning block">
                <p>{t('translation-needs-review-help')}</p>
                {canEdit && cell.translationId && (
                  <button
                    className="btn btn-warning btn-sm mt-3"
                    disabled={isPending}
                    onClick={() =>
                      run(
                        () => actions.markReviewed(cell.translationId!),
                        'Translation marked reviewed'
                      )
                    }
                    type="button"
                  >
                    {t('keep-current-translation')}
                  </button>
                )}
              </div>
            )}

            {suggestion && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs font-semibold uppercase text-info">
                  {t('ai-suggestion')}
                </p>
                <p className="mt-2 text-sm">{suggestion}</p>
                <button
                  className="btn btn-info btn-sm mt-3"
                  disabled={isPending}
                  onClick={acceptSuggestion}
                  type="button"
                >
                  {t('accept-suggestion')}
                </button>
              </div>
            )}
          </div>

          {canEdit && (
            <footer className="space-y-2 bg-card p-5">
              {!isSourceLocale && (
                <button
                  className="btn btn-outline btn-primary w-full"
                  disabled={isPending}
                  onClick={generateSuggestion}
                  type="button"
                >
                  {t('generate-ai-suggestion')}
                </button>
              )}
              <button
                className="btn btn-primary w-full"
                disabled={isPending || value === (cell.value ?? '')}
                onClick={save}
                type="button"
              >
                {t('save-manual-translation')}
              </button>
            </footer>
          )}
        </aside>
      </div>
    </div>
  );
};

export default TranslationDrawer;
