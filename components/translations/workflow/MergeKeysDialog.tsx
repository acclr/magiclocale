import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import {
  suggestMergedKeyName,
  type DashboardRow,
  type DuplicateKeyGroup,
  type MergeKeysResult,
} from '../../../domain/translations';
import { CheckIcon, CopyIcon, GitMergeIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

export type MergeKeysDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: readonly DashboardRow[];
  duplicateGroups: readonly DuplicateKeyGroup[];
  initialSelectedKeys?: readonly string[];
  initialTargetKey?: string;
  canPublish: boolean;
  environmentName: string;
  onMerge: (input: {
    sourceKeys: string[];
    targetKey: string;
    sourceText?: string;
  }) => Promise<MergeKeysResult>;
  onPublish: (message?: string) => Promise<unknown>;
  onMerged?: (result: MergeKeysResult) => void;
};

const MergeKeysDialog = ({
  open,
  onOpenChange,
  rows,
  duplicateGroups,
  initialSelectedKeys = [],
  initialTargetKey,
  canPublish,
  environmentName,
  onMerge,
  onPublish,
  onMerged,
}: MergeKeysDialogProps) => {
  const { t } = useTranslation('common');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [targetKey, setTargetKey] = useState('');
  const [targetKeyTouched, setTargetKeyTouched] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [sourceTextTouched, setSourceTextTouched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedMerge, setCompletedMerge] = useState<{
    result: MergeKeysResult;
    published: boolean;
  } | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const activeRows = useMemo(
    () =>
      rows.filter(
        (row) => row.lifecycle !== 'deprecated' && row.lifecycle !== 'archived'
      ),
    [rows]
  );

  const rowByKey = useMemo(
    () => new Map(activeRows.map((row) => [row.key, row])),
    [activeRows]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setCompletedMerge(null);
    setSearchQuery('');
    const seedKeys =
      initialSelectedKeys.length > 0
        ? [...initialSelectedKeys]
        : duplicateGroups[0]
          ? duplicateGroups[0].keys.map((item) => item.key)
          : [];
    setSelectedKeys(seedKeys);
    const defaultTarget =
      initialTargetKey ||
      (seedKeys.length > 0 ? suggestMergedKeyName(seedKeys) : '');
    setTargetKey(defaultTarget);
    setTargetKeyTouched(Boolean(initialTargetKey));

    const firstRow = seedKeys
      .map((keyName) => rowByKey.get(keyName))
      .find(Boolean);
    setSourceText(firstRow?.sourceText ?? '');
    setSourceTextTouched(false);
  }, [open, initialSelectedKeys, initialTargetKey, duplicateGroups, rowByKey]);

  const applySelection = (
    nextKeys: string[],
    explicitSuggestedTarget?: string
  ) => {
    setSelectedKeys(nextKeys);
    if (!targetKeyTouched) {
      setTargetKey(
        explicitSuggestedTarget ??
          (nextKeys.length > 0 ? suggestMergedKeyName(nextKeys) : '')
      );
    }
    if (!sourceTextTouched) {
      const firstRow = nextKeys
        .map((keyName) => rowByKey.get(keyName))
        .find(Boolean);
      if (firstRow) {
        setSourceText(firstRow.sourceText);
      }
    }
  };

  const toggleKey = (keyName: string) => {
    const exists = selectedKeys.includes(keyName);
    const next = exists
      ? selectedKeys.filter((item) => item !== keyName)
      : [...selectedKeys, keyName];
    applySelection(next);
  };

  const selectDuplicateGroup = (group: DuplicateKeyGroup) => {
    const groupKeys = group.keys.map((item) => item.key);
    setTargetKeyTouched(false);
    setSourceTextTouched(false);
    setSelectedKeys(groupKeys);
    setTargetKey(group.suggestedKey);
    setSourceText(group.sourceText);
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase();
    const list = q
      ? activeRows.filter(
          (row) =>
            row.key.toLocaleLowerCase().includes(q) ||
            row.sourceText.toLocaleLowerCase().includes(q)
        )
      : activeRows;
    return [...list].sort((left, right) => {
      const leftSelected = selectedKeys.includes(left.key) ? 0 : 1;
      const rightSelected = selectedKeys.includes(right.key) ? 0 : 1;
      if (leftSelected !== rightSelected) {
        return leftSelected - rightSelected;
      }
      return left.key.localeCompare(right.key);
    });
  }, [activeRows, searchQuery, selectedKeys]);

  const keysToReplace = useMemo(
    () =>
      selectedKeys.filter(
        (keyName) => keyName.trim() && keyName.trim() !== targetKey.trim()
      ),
    [selectedKeys, targetKey]
  );

  const canSubmit =
    !isSubmitting &&
    Boolean(targetKey.trim()) &&
    selectedKeys.length >= 2 &&
    keysToReplace.length >= 1;

  const submitMerge = async (publishAfter: boolean) => {
    if (!canSubmit) {
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await onMerge({
        sourceKeys: selectedKeys,
        targetKey: targetKey.trim(),
        sourceText: sourceText.trim() || undefined,
      });
      let published = false;
      if (publishAfter && canPublish) {
        await onPublish(
          `Merge keys (${result.mergedKeys.join(', ')}) into ${result.targetKey}`
        );
        published = true;
      }
      toast.success(
        t('merge-keys-success', {
          count: result.mergedKeys.length,
          targetKey: result.targetKey,
        })
      );
      setCompletedMerge({ result, published });
      onMerged?.(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Merge failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishMergedChanges = async () => {
    if (!completedMerge) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onPublish(
        `Merge keys (${completedMerge.result.mergedKeys.join(', ')}) into ${completedMerge.result.targetKey}`
      );
      setCompletedMerge({
        ...completedMerge,
        published: true,
      });
      toast.success(`Published ${environmentName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Publish failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCommand = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCommand(cmd);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMergeIcon className="size-4" />
            {t('merge-keys-title')}
          </DialogTitle>
          <DialogDescription>{t('merge-keys-description')}</DialogDescription>
        </DialogHeader>

        {completedMerge ? (
          <div className="space-y-4 py-2 text-sm">
            <div className="rounded-md border border-border bg-elevated p-3 space-y-2">
              <div className="font-medium">
                {t('merge-keys-success', {
                  count: completedMerge.result.mergedKeys.length,
                  targetKey: completedMerge.result.targetKey,
                })}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {completedMerge.result.mergedKeys.map((fromKey) => (
                  <span
                    className="rounded bg-card px-2 py-0.5 font-mono"
                    key={fromKey}
                  >
                    {fromKey} &rarr; {completedMerge.result.targetKey}
                  </span>
                ))}
              </div>
            </div>

            {!completedMerge.published && canPublish ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div>
                  <div className="font-medium">
                    Publish to {environmentName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Publish this environment so live clients receive{' '}
                    <code className="font-mono">
                      {completedMerge.result.targetKey}
                    </code>
                    .
                  </div>
                </div>
                <Button
                  disabled={isSubmitting}
                  onClick={() => void publishMergedChanges()}
                  size="sm"
                  type="button"
                >
                  {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                  Publish {environmentName}
                </Button>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="font-medium">{t('merge-keys-cli-heading')}</div>
              <p className="text-xs text-muted-foreground">
                {t('merge-keys-cli-instructions')}
              </p>
              {['npx @keykithq/cli merge-keys', 'npx @keykithq/cli sync'].map(
                (cmd) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 font-mono text-xs"
                    key={cmd}
                  >
                    <span>{cmd}</span>
                    <Button
                      onClick={() => void copyCommand(cmd)}
                      size="xs"
                      type="button"
                      variant="ghost"
                    >
                      {copiedCommand === cmd ? (
                        <CheckIcon className="size-3.5" />
                      ) : (
                        <CopyIcon className="size-3.5" />
                      )}
                    </Button>
                  </div>
                )
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} type="button">
                {t('merge-keys-done')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-1 text-sm">
            {duplicateGroups.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('merge-keys-detected-groups')} ({duplicateGroups.length})
                </span>
                <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {duplicateGroups.map((group) => {
                    const isGroupSelected =
                      group.keys.length === selectedKeys.length &&
                      group.keys.every((item) =>
                        selectedKeys.includes(item.key)
                      );
                    return (
                      <button
                        className={`rounded-md border px-2.5 py-1 text-left text-xs transition ${
                          isGroupSelected
                            ? 'border-primary bg-primary/10 font-medium'
                            : 'border-border bg-card hover:bg-elevated'
                        }`}
                        key={group.id}
                        onClick={() => selectDuplicateGroup(group)}
                        type="button"
                      >
                        <span className="font-semibold">
                          &ldquo;{group.sourceText}&rdquo;
                        </span>{' '}
                        <span className="font-mono text-muted-foreground">
                          ({group.keys.map((k) => k.key).join(', ')} &rarr;{' '}
                          {group.suggestedKey})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('merge-keys-select-keys')} ({selectedKeys.length} selected)
                </span>
                {selectedKeys.length > 0 ? (
                  <button
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => applySelection([])}
                    type="button"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <input
                className="input input-bordered input-sm w-full"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('merge-keys-search-placeholder')}
                type="search"
                value={searchQuery}
              />
              <div className="max-h-44 overflow-y-auto rounded-md border border-border divide-y divide-border">
                {filteredRows.slice(0, 60).map((row) => {
                  const checked = selectedKeys.includes(row.key);
                  return (
                    <label
                      className="flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 hover:bg-elevated"
                      key={row.keyId}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <input
                          checked={checked}
                          className="checkbox checkbox-xs"
                          onChange={() => toggleKey(row.key)}
                          type="checkbox"
                        />
                        <span className="truncate font-mono text-xs">
                          {row.key}
                        </span>
                      </span>
                      <span className="truncate text-xs text-muted-foreground max-w-52">
                        {row.sourceText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('merge-keys-target-key')}
                </span>
                <input
                  className="input input-bordered input-sm font-mono"
                  onChange={(event) => {
                    setTargetKey(event.target.value);
                    setTargetKeyTouched(true);
                  }}
                  placeholder={t('merge-keys-target-placeholder')}
                  type="text"
                  value={targetKey}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('merge-keys-source-text')}
                </span>
                <input
                  className="input input-bordered input-sm"
                  onChange={(event) => {
                    setSourceText(event.target.value);
                    setSourceTextTouched(true);
                  }}
                  type="text"
                  value={sourceText}
                />
              </label>
            </div>

            {selectedKeys.length >= 2 && targetKey.trim() ? (
              <div className="rounded-md border border-border bg-elevated px-3 py-2 text-xs text-muted-foreground">
                Consolidating{' '}
                <span className="font-mono text-foreground">
                  {selectedKeys.join(', ')}
                </span>{' '}
                into{' '}
                <span className="font-mono font-semibold text-foreground">
                  {targetKey.trim()}
                </span>
                .
              </div>
            ) : null}

            <DialogFooter>
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={!canSubmit}
                onClick={() => void submitMerge(false)}
                type="button"
                variant={canPublish ? 'outline' : 'default'}
              >
                {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                {t('merge-keys-submit')}
              </Button>
              {canPublish ? (
                <Button
                  disabled={!canSubmit}
                  onClick={() => void submitMerge(true)}
                  type="button"
                >
                  {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                  {t('merge-keys-submit-and-publish')}
                </Button>
              ) : null}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MergeKeysDialog;
