import { Loading } from '@/components/shared';
import { useSession } from 'next-auth/react';
import React from 'react';
import { useRouter } from 'next/router';

import ContentTopbar from './ContentTopbar';
import Drawer from './Drawer';
import Header from './Header';
import { SidebarLayoutProvider, useSidebarLayout } from './SidebarContext';
import { WorkspaceToolbarSlotProvider } from './WorkspaceToolbarSlot';

function AppShellFrame({ children }: { children: React.ReactNode }) {
  const { contentOffset } = useSidebarLayout();

  return (
    <div className="app-canvas flex min-h-screen flex-col">
      <Header />
      <Drawer />
      <div
        className="flex min-h-full flex-1 flex-col transition-[padding] duration-200 lg:pl-(--sidebar-offset)"
        style={
          {
            '--sidebar-offset': `${contentOffset}px`,
          } as React.CSSProperties
        }
      >
        <ContentTopbar />
        <main className="flex-1 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const router = useRouter();
  const { status } = useSession();

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  return (
    <SidebarLayoutProvider>
      <WorkspaceToolbarSlotProvider>
        <AppShellFrame>{children}</AppShellFrame>
      </WorkspaceToolbarSlotProvider>
    </SidebarLayoutProvider>
  );
}
