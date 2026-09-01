import type { DashboardCell } from '../../domain/translations';
import type { CellSaveOptions } from './CellDrafts';
import { useCellDrafts } from './CellDrafts';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import StatusBadge from './StatusBadge';

type TranslationCellProps = {
  keyId: string;
  cell: DashboardCell;
  fallbackValue?: string;
  canEdit: boolean;
  onOpen: () => void;
  onSave: (value: string, options?: CellSaveOptions) => Promise<unknown>;
};

const TranslationCell = ({
  keyId,
  cell,
  fallbackValue = '',
  canEdit,
  onOpen,
  onSave,
}: TranslationCellProps) => {
  const { t } = useTranslation('common');
  const drafts = useCellDrafts();
  const persistedValue = cell.value ?? fallbackValue;
  const [baseline, setBaseline] = useState(persistedValue);
  const [value, setValue] = useState(persistedValue);
  const [isSaving, setIsSaving] = useState(false);
  const valueRef = useRef(value);
  const baselineRef = useRef(baseline);
  const isDirtyRef = useRef(false);
  const draftsRef = useRef(drafts);
  const draftId = `${keyId}:${cell.locale}`;
  const isDirty = canEdit && value !== baseline;

  valueRef.current = value;
  baselineRef.current = baseline;
  isDirtyRef.current = isDirty;
  draftsRef.current = drafts;

  useEffect(() => {
    if (isDirtyRef.current) {
      return;
    }
    setBaseline(persistedValue);
    setValue(persistedValue);
  }, [persistedValue]);

  const save = async (options?: CellSaveOptions) => {
    if (!canEdit || isSaving || valueRef.current === baselineRef.current) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(valueRef.current, options);
      setBaseline(valueRef.current);
      if (!options?.silent) {
        toast.success(t('translation-saved'));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('could-not-save-translation')
      );
      setValue(baselineRef.current);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const discard = () => {
    setValue(baselineRef.current);
  };

  const saveRef = useRef(save);
  const discardRef = useRef(discard);
  saveRef.current = save;
  discardRef.current = discard;

  useEffect(() => {
    if (!isDirty) {
      draftsRef.current.unregister(draftId);
      return;
    }

    draftsRef.current.register(draftId, {
      save: (options) => saveRef.current(options),
      discard: () => discardRef.current(),
    });
    return () => draftsRef.current.unregister(draftId);
  }, [draftId, isDirty]);

  return (
    <div className="min-w-64 space-y-2 p-3">
      <textarea
        aria-label={`${cell.locale} translation`}
        className="textarea textarea-bordered textarea-sm w-full resize-none bg-base-100"
        disabled={!canEdit || isSaving || drafts.isSavingAll}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            void save();
          }
        }}
        placeholder="Add translation…"
        rows={2}
        value={value}
      />
      <div className="flex items-center justify-between gap-2">
        <StatusBadge
          missing={cell.missing}
          source={cell.source}
          status={cell.status}
        />
        <div className="flex items-center gap-1">
          {isDirty && (
            <>
              <button
                className="btn btn-ghost btn-xs"
                disabled={isSaving || drafts.isSavingAll}
                onClick={discard}
                type="button"
              >
                {t('discard-cell')}
              </button>
              <button
                className="btn btn-primary btn-xs"
                disabled={isSaving || drafts.isSavingAll}
                onClick={() => void save()}
                type="button"
              >
                {t('save-cell')}
              </button>
            </>
          )}
          <button
            className="btn btn-ghost btn-xs"
            onClick={onOpen}
            type="button"
          >
            {t('details')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationCell;
