import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { RocketIcon } from 'lucide-react';

import usePublishAction from '../../hooks/usePublishAction';
import type { PublishState } from '../../hooks/useTranslationWorkspace';

type PublishButtonProps = {
  publishState?: PublishState;
  canPublish: boolean;
  environmentName?: string;
  onPublish: (message?: string) => Promise<unknown>;
  /** Extra disable, for example while cell edits are still unsaved. */
  disabled?: boolean;
};

/** Compact header button; renders nothing when there is nothing to publish. */
const PublishButton = ({
  publishState,
  canPublish,
  environmentName,
  onPublish,
  disabled = false,
}: PublishButtonProps) => {
  const { t } = useTranslation('common');
  const pendingCount = publishState?.pendingCount ?? 0;
  const environment = environmentName ?? t('this-environment');
  const { publish, isPublishing } = usePublishAction({
    pendingCount,
    environmentName,
    onPublish,
  });

  if (!canPublish || pendingCount === 0) {
    return null;
  }

  return (
    <Button
      disabled={disabled || isPublishing}
      onClick={() => void publish()}
      title={t('unpublished-changes-help', {
        translations: publishState?.translationCount ?? 0,
        flags: publishState?.flagCount ?? 0,
        environment,
      })}
      type="button"
    >
      {isPublishing ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <RocketIcon data-icon="inline-start" />
      )}
      {isPublishing ? t('publishing') : t('publish')}
      <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs tabular-nums">
        {pendingCount}
      </span>
    </Button>
  );
};

export default PublishButton;
