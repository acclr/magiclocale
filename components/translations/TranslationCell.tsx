import type { DashboardCell } from '../../domain/translations';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import StatusBadge from './StatusBadge';

type TranslationCellProps = {
  cell: DashboardCell;
  fallbackValue?: string;
  canEdit: boolean;
  onOpen: () => void;
  onSave: (value: string) => Promise<unknown>;
};

const TranslationCell = ({
  cell,
  fallbackValue = '',
  canEdit,
  onOpen,
  onSave,
}: TranslationCellProps) => {
  const { t } = useTranslation('common');
  const persistedValue = cell.value ?? fallbackValue;
  const [value, setValue] = useState(persistedValue);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(persistedValue);
  }, [persistedValue]);

  const save = async () => {
    if (!canEdit || isSaving || value === persistedValue) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(value);
      toast.success('Translation saved');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save translation'
      );
      setValue(persistedValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-w-64 space-y-2 p-3">
      <textarea
        aria-label={`${cell.locale} translation`}
        className="textarea textarea-bordered textarea-sm w-full resize-none bg-base-100"
        disabled={!canEdit || isSaving}
        onBlur={save}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
        placeholder="Add translation…"
        rows={2}
        value={value}
      />
      <div className="flex items-center justify-between">
        <StatusBadge
          missing={cell.missing}
          source={cell.source}
          status={cell.status}
        />
        <button
          className="btn btn-ghost btn-xs"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onOpen}
          type="button"
        >
          {t('details')}
        </button>
      </div>
    </div>
  );
};

export default TranslationCell;
