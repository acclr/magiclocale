import { Loading } from '@/components/shared';
import { useSession } from 'next-auth/react';
import React from 'react';
import { useRouter } from 'next/router';

import Drawer from './Drawer';
import Header from './Header';
import { SidebarLayoutProvider, useSidebarLayout } from './SidebarContext';

function AppShellFrame({ children }: { children: React.ReactNode }) {
  const { contentOffset } = useSidebarLayout();

  return (
    <div>
      <Header />
      <Drawer />
      <div
        className="transition-[padding] duration-200 lg:pl-(--sidebar-offset)"
        style={
          {
            '--sidebar-offset': `${contentOffset}px`,
          } as React.CSSProperties
        }
      >
        <main className="py-5">
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
      <AppShellFrame>{children}</AppShellFrame>
    </SidebarLayoutProvider>
  );
}
