import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/hooks/useTranslation';

import PrimarySidebar from './PrimarySidebar';
import ProjectSidebar from './ProjectSidebar';
import { useSidebarLayout } from './SidebarContext';
import { getPrimarySidebarWidth, PROJECT_SIDEBAR_WIDTH } from './sidebar';

const Drawer = () => {
  const { t } = useTranslation('common');
  const { collapsed, isProjectRoute, mobileOpen, mobileView, setMobileOpen } =
    useSidebarLayout();
  const primaryWidth = getPrimarySidebarWidth(collapsed);

  return (
    <>
      {mobileOpen && (
        <div className="relative z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600/80"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="sr-only">{t('close-sidebar')}</span>
                  <XMarkIcon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div className="flex w-full grow flex-col overflow-hidden border-r border-sidebar-border bg-sidebar pb-4">
                {mobileView === 'project' && isProjectRoute ? (
                  <ProjectSidebar variant="mobile" />
                ) : (
                  <PrimarySidebar variant="mobile" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="hidden shrink-0 border-r border-foreground/5 bg-[#040404] text-sidebar-foreground transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col"
        style={{ width: primaryWidth }}
      >
        <PrimarySidebar />
      </div>

      {isProjectRoute && (
        <div
          className="hidden shrink-0 border-r border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground transition-[left] duration-200 lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col"
          style={{ left: primaryWidth, width: PROJECT_SIDEBAR_WIDTH }}
        >
          <ProjectSidebar />
        </div>
      )}
    </>
  );
};

export default Drawer;
