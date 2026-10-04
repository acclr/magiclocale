import { useState } from 'react';

import type { TranslationFilter } from '../domain/translations';
import type { BulkSelection } from './useBulkSelection';
import useAsyncAction from './useAsyncAction';
import type { TranslationWorkspaceActions } from './useTranslationWorkspace';

export type QueueMode = 'fill-missing' | 'retranslate';

type QueueResult = Awaited<
  ReturnType<TranslationWorkspaceActions['queueTranslations']>
>;

type TranslationQueueOptions = {
  queueTranslations: TranslationWorkspaceActions['queueTranslations'];
  keys: BulkSelection;
  locales: string[];
  filter: TranslationFilter;
  search: string;
  onQueued?: (result: QueueResult, keyCount: number) => void;
  onError?: (error: unknown) => void;
};

/** Turns the current key + locale selection into a translation queue request. */
export default function useTranslationQueue({
  queueTranslations,
  keys,
  locales,
  filter,
  search,
  onQueued,
  onError,
}: TranslationQueueOptions) {
  const [pendingMode, setPendingMode] = useState<QueueMode | null>(null);

  const { run } = useAsyncAction(
    (mode: QueueMode, fromLocale?: string) =>
      queueTranslations({
        scope: keys.allMatching ? 'all-matching' : 'selected-keys',
        keyIds: keys.allMatching ? undefined : keys.ids,
        locales,
        mode,
        sourceLocale: mode === 'retranslate' ? fromLocale : undefined,
        filter,
        search,
      }),
    {
      onSuccess: (result) => {
        onQueued?.(result, keys.count);
        keys.clear();
      },
      onError,
    }
  );

  const queue = async (mode: QueueMode, fromLocale?: string) => {
    setPendingMode(mode);
    try {
      await run(mode, fromLocale);
    } finally {
      setPendingMode(null);
    }
  };

  return {
    queue,
    pendingMode,
    canQueue: keys.hasSelection && locales.length > 0 && pendingMode === null,
  };
}
