import { Bars3Icon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/hooks/useTranslation';

import { Button } from '@/components/ui/button';
import Brand from './Brand';
import { useSidebarLayout } from './SidebarContext';

const Header = () => {
  const { t } = useTranslation('common');
  const { openMobileSidebar } = useSidebarLayout();

  return (
    <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground lg:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={openMobileSidebar}
      >
        <span className="sr-only">{t('open-sidebar')}</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </Button>
      <Brand />
    </div>
  );
};

export default Header;
