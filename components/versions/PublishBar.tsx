import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import type { PublishState } from '../../hooks/useTranslationWorkspace';
import { Alert } from '../ui/alert';
import { CloudSyncIcon, RefreshCcwIcon } from 'lucide-react';

type PublishBarProps = {
  publishState?: PublishState;
  canPublish: boolean;
  environmentName?: string;
  onPublish: (message?: string) => Promise<unknown>;
};

const PublishBar = ({
  publishState,
  canPublish,
  environmentName,
  onPublish,
}: PublishBarProps) => {
  const { t } = useTranslation('common');
  const [isPublishing, setIsPublishing] = useState(false);
  const pending = publishState?.pendingCount ?? 0;

  if (!publishState || pending === 0) {
    return null;
  }

  const publish = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
      toast.success(
        t('published-changes', {
          count: pending,
          environment: environmentName ?? t('this-environment'),
        })
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('publish-failed')
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex rounded-xl flex-row fixed bottom-8 left-1/2 -translate-x-1/2 w-1/3 z-50 bg-foreground border-border shadow-lg p-4 text-foreground flex-wrap items-center justify-between gap-3">
      <div className="flex flex-row items-start gap-4">
        <div className="flex flex-col">
          <div className="flex mb-1.5 items-center font-semibold text-background">
            <RefreshCcwIcon className="w-5 h-5" />
            <span className="ml-1.5">{t('unpublished-changes-title', { count: pending })}</span>!
          </div>
          <p className="text-sm text-background/80">
            {t('unpublished-changes-help', {
              translations: publishState.translationCount,
              flags: publishState.flagCount,
              environment: environmentName ?? t('this-environment'),
            })}
          </p>
        </div>

        {canPublish ? (
          <button
            className="btn btn-primary btn-md"
            disabled={isPublishing}
            onClick={publish}
            type="button"
          >
            {isPublishing ? t('publishing') : t('publish')}
          </button>
        ) : null}
      </div>

    </div>
  );
};

export default PublishBar;
