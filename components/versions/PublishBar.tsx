import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import type { PublishState } from '../../hooks/useTranslationWorkspace';
import { RefreshCcwIcon } from 'lucide-react';

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
      toast.error(error instanceof Error ? error.message : t('publish-failed'));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 flex-row flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-foreground">
      <div className="flex flex-row items-start gap-4">
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center font-semibold text-foreground">
            <RefreshCcwIcon className="w-5 h-5" />
            <span className="ml-1.5">
              {t('unpublished-changes-title', { count: pending })}
            </span>
            !
          </div>
          <p className="text-sm text-muted-foreground">
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
