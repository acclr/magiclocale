import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useCellDrafts } from './CellDrafts';

type TranslationSaveBarProps = {
  onRefresh: () => Promise<unknown>;
};

const TranslationSaveBar = ({ onRefresh }: TranslationSaveBarProps) => {
  const { t } = useTranslation('common');
  const drafts = useCellDrafts();
  const [isDiscarding, setIsDiscarding] = useState(false);

  useEffect(() => {
    if (drafts.dirtyCount === 0) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [drafts.dirtyCount]);

  if (drafts.dirtyCount === 0) {
    return null;
  }

  const saveAll = async () => {
    try {
      const saved = await drafts.saveAll();
      await onRefresh();
      toast.success(t('translations-saved', { count: saved }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('could-not-save-translation')
      );
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4">
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-lg border border-base-300 bg-base-100 px-4 py-3">
        <div>
          <p className="font-medium">
            {t('unsaved-translations', { count: drafts.dirtyCount })}
          </p>
          <p className="text-sm text-base-content/60">{t('save-all-help')}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-sm"
            disabled={drafts.isSavingAll || isDiscarding}
            onClick={() => {
              setIsDiscarding(true);
              drafts.discardAll();
              setIsDiscarding(false);
            }}
            type="button"
          >
            {t('discard-all-translations')}
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={drafts.isSavingAll || isDiscarding}
            onClick={() => void saveAll()}
            type="button"
          >
            {drafts.isSavingAll ? t('loading') : t('save-all-translations')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationSaveBar;
