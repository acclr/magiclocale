import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';

import useAsyncAction from './useAsyncAction';

type PublishActionOptions = {
  pendingCount: number;
  environmentName?: string;
  onPublish: (message?: string) => Promise<unknown>;
};

export default function usePublishAction({
  pendingCount,
  environmentName,
  onPublish,
}: PublishActionOptions) {
  const { t } = useTranslation('common');
  const environment = environmentName ?? t('this-environment');

  const { run, isRunning } = useAsyncAction(onPublish, {
    onSuccess: () =>
      toast.success(
        t('published-changes', { count: pendingCount, environment })
      ),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : t('publish-failed')),
  });

  return { publish: () => run(), isPublishing: isRunning };
}
