import { useEffect, useState } from 'react';

type BulkSelectionOptions = {
  pageIds: string[];
  totalMatching: number;
  /** Selection resets whenever this value changes (filters, search, scope). */
  resetKey: string;
};

export type BulkSelection = ReturnType<typeof useBulkSelection>;

/**
 * Tracks ids picked individually or "everything matching the current query",
 * without materialising ids that are not on the current page.
 */
export default function useBulkSelection({
  pageIds,
  totalMatching,
  resetKey,
}: BulkSelectionOptions) {
  const [ids, setIds] = useState<string[]>([]);
  const [allMatching, setAllMatching] = useState(false);

  useEffect(() => {
    setIds([]);
    setAllMatching(false);
  }, [resetKey]);

  const pageFullySelected =
    pageIds.length > 0 && pageIds.every((id) => ids.includes(id));
  const pagePartiallySelected =
    !pageFullySelected && pageIds.some((id) => ids.includes(id));

  const clear = () => {
    setIds([]);
    setAllMatching(false);
  };

  const toggle = (id: string) => {
    if (allMatching) {
      setAllMatching(false);
      setIds(pageIds.filter((pageId) => pageId !== id));
      return;
    }
    setIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const togglePage = () => {
    if (allMatching) {
      clear();
      return;
    }
    if (pageFullySelected) {
      setIds((current) => current.filter((id) => !pageIds.includes(id)));
      return;
    }
    setIds((current) => Array.from(new Set([...current, ...pageIds])));
  };

  const setMatchingScope = (all: boolean) => {
    setAllMatching(all);
    setIds(all ? [] : pageIds);
  };

  return {
    ids,
    allMatching,
    count: allMatching ? totalMatching : ids.length,
    hasSelection: allMatching || ids.length > 0,
    allPageSelected: allMatching || pageFullySelected,
    somePageSelected: !allMatching && pagePartiallySelected,
    isSelected: (id: string) => allMatching || ids.includes(id),
    toggle,
    togglePage,
    totalMatching,
    setMatchingScope,
    clear,
  };
}
