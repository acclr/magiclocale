import { useRouter } from 'next/router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getPrimarySidebarWidth } from './sidebar';

type SidebarContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  contentOffset: number;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  openMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = router.asPath.split('?')[0];
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => !current);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      mobileOpen,
      contentOffset: getPrimarySidebarWidth(collapsed),
      toggleCollapsed,
      setMobileOpen,
      openMobileSidebar,
    }),
    [collapsed, mobileOpen, openMobileSidebar, toggleCollapsed]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebarLayout() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error(
      'useSidebarLayout must be used within SidebarLayoutProvider'
    );
  }

  return context;
}
