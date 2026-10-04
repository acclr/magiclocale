import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, SaveIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import useAsyncAction from '../../../hooks/useAsyncAction';
import type { PublishState } from '../../../hooks/useTranslationWorkspace';
import useUnsavedChangesGuard from '../../../hooks/useUnsavedChangesGuard';
import PublishButton from '../../versions/PublishButton';
import { useCellDrafts } from '../CellDrafts';

type NextStepButtonProps = {
  publishState?: PublishState;
  environmentName?: string;
  canPublish: boolean;
  onPublish: (message?: string) => Promise<unknown>;
  onDraftsSaved: () => Promise<unknown>;
};

/**
 * Save sits beside Publish. Save appears while cells are dirty, and Publish
 * stays available for unpublished changes but waits until those edits are saved.
 */
const NextStepButton = ({
  publishState,
  environmentName,
  canPublish,
  onPublish,
  onDraftsSaved,
}: NextStepButtonProps) => {
  const { t } = useTranslation('common');
  const drafts = useCellDrafts();
  const hasDrafts = drafts.dirtyCount > 0;

  useUnsavedChangesGuard(hasDrafts);

  const saveDrafts = useAsyncAction(
    async () => {
      const saved = await drafts.saveAll();
      await onDraftsSaved();
      return saved;
    },
    {
      onSuccess: (saved) =>
        toast.success(t('translations-saved', { count: saved })),
      onError: (error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : t('could-not-save-translation')
        ),
    }
  );
  const isSaving = drafts.isSavingAll || saveDrafts.isRunning;

  return (
    <>
      {hasDrafts ? (
        <div className="inline-flex">
          <Button
            className="rounded-r-none"
            disabled={isSaving}
            onClick={() => void saveDrafts.run()}
            type="button"
          >
            {isSaving ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <SaveIcon data-icon="inline-start" />
            )}
            {isSaving ? t('saving') : t('save-all-translations')}
            <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs tabular-nums">
              {drafts.dirtyCount}
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t('more-actions')}
                className="rounded-l-none border-l border-l-primary-foreground/25 px-1.5"
                disabled={isSaving}
                type="button"
              >
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-44">
              <DropdownMenuItem
                onSelect={drafts.discardAll}
                variant="destructive"
              >
                {t('discard-all-translations')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
      <PublishButton
        canPublish={canPublish}
        disabled={hasDrafts || isSaving}
        environmentName={environmentName}
        onPublish={onPublish}
        publishState={publishState}
      />
    </>
  );
};

export default NextStepButton;
