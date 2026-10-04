import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

const WorkspaceToolbarSlotContext = createContext<HTMLDivElement | null>(null);
const WorkspaceToolbarSlotSetterContext = createContext<
  (node: HTMLDivElement | null) => void
>(() => {});

export function WorkspaceToolbarSlotProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  return (
    <WorkspaceToolbarSlotSetterContext.Provider value={setNode}>
      <WorkspaceToolbarSlotContext.Provider value={node}>
        {children}
      </WorkspaceToolbarSlotContext.Provider>
    </WorkspaceToolbarSlotSetterContext.Provider>
  );
}

/** Mount point in the content top bar. Editor actions portal into this node. */
export function WorkspaceToolbarSlot() {
  const setNode = useContext(WorkspaceToolbarSlotSetterContext);

  return (
    <div ref={setNode} className="flex items-center gap-2 empty:hidden" />
  );
}

export function WorkspaceToolbarPortal({ children }: { children: ReactNode }) {
  const node = useContext(WorkspaceToolbarSlotContext);

  if (!node) {
    return null;
  }

  return createPortal(children, node);
}
