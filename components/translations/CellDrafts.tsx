import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type CellSaveOptions = {
  silent?: boolean;
  refresh?: boolean;
};

export type CellDraftHandle = {
  save: (options?: CellSaveOptions) => Promise<void>;
  discard: () => void;
};

type CellDraftsValue = {
  dirtyCount: number;
  isSavingAll: boolean;
  register: (id: string, handle: CellDraftHandle) => void;
  unregister: (id: string) => void;
  saveAll: () => Promise<number>;
  discardAll: () => void;
};

const CellDraftsContext = createContext<CellDraftsValue | null>(null);

export function CellDraftsProvider({ children }: { children: ReactNode }) {
  const handles = useRef(new Map<string, CellDraftHandle>());
  const [dirtyCount, setDirtyCount] = useState(0);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const syncCount = useCallback(() => {
    setDirtyCount(handles.current.size);
  }, []);

  const register = useCallback(
    (id: string, handle: CellDraftHandle) => {
      handles.current.set(id, handle);
      syncCount();
    },
    [syncCount]
  );

  const unregister = useCallback(
    (id: string) => {
      if (handles.current.delete(id)) {
        syncCount();
      }
    },
    [syncCount]
  );

  const saveAll = useCallback(async () => {
    const batch: CellDraftHandle[] = [];
    handles.current.forEach((handle) => {
      batch.push(handle);
    });
    setIsSavingAll(true);
    try {
      for (let index = 0; index < batch.length; index += 1) {
        await batch[index].save({ silent: true, refresh: false });
      }
    } finally {
      setIsSavingAll(false);
    }
    return batch.length;
  }, []);

  const discardAll = useCallback(() => {
    handles.current.forEach((handle) => handle.discard());
  }, []);

  const value = useMemo(
    () => ({
      dirtyCount,
      isSavingAll,
      register,
      unregister,
      saveAll,
      discardAll,
    }),
    [dirtyCount, isSavingAll, register, unregister, saveAll, discardAll]
  );

  return (
    <CellDraftsContext.Provider value={value}>
      {children}
    </CellDraftsContext.Provider>
  );
}

export function useCellDrafts(): CellDraftsValue {
  const context = useContext(CellDraftsContext);
  if (!context) {
    throw new Error('useCellDrafts must be used inside CellDraftsProvider.');
  }
  return context;
}
