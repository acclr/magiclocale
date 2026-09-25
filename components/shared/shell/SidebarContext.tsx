import { useRouter } from 'next/router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getSidebarOffset } from './sidebar';

type MobileSidebarView = 'primary' | 'project';

type SidebarContextValue = {
  collapsed: boolean;
  isProjectRoute: boolean;
  mobileOpen: boolean;
  mobileView: MobileSidebarView;
  contentOffset: number;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  openMobileSidebar: () => void;
  setMobileView: (view: MobileSidebarView) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const projectId =
    typeof router.query.projectId === 'string' ? router.query.projectId : null;
  const asPathHasProject = /\/projects\/[^/?]+/.test(router.asPath);
  const isProjectRoute =
    (router.isReady && Boolean(projectId)) || asPathHasProject;

  const pathname = router.asPath.split('?')[0];
  const [collapsed, setCollapsed] = useState(asPathHasProject);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileSidebarView>('primary');

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    setCollapsed(Boolean(projectId));
    setMobileView(projectId ? 'project' : 'primary');
  }, [projectId, router.isReady]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => !current);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setMobileView(isProjectRoute ? 'project' : 'primary');
    setMobileOpen(true);
  }, [isProjectRoute]);

  const value = useMemo(
    () => ({
      collapsed,
      isProjectRoute,
      mobileOpen,
      mobileView,
      contentOffset: getSidebarOffset({ collapsed, isProjectRoute }),
      toggleCollapsed,
      setMobileOpen,
      openMobileSidebar,
      setMobileView,
    }),
    [
      collapsed,
      isProjectRoute,
      mobileOpen,
      mobileView,
      openMobileSidebar,
      toggleCollapsed,
    ]
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
