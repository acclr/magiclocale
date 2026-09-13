import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from '@/hooks/useTranslation';

import TeamDropdown from '../TeamDropdown';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import AccountMenu from './AccountMenu';
import Brand from './Brand';
import Navigation from './Navigation';
import { useSidebarLayout } from './SidebarContext';

const PrimarySidebar = ({
  variant = 'desktop',
}: {
  variant?: 'desktop' | 'mobile';
}) => {
  const { t } = useTranslation('common');
  const { collapsed, toggleCollapsed } = useSidebarLayout();
  const isCollapsed = variant === 'desktop' && collapsed;
  const collapseLabel = isCollapsed
    ? t('expand-sidebar')
    : t('collapse-sidebar');

  const collapseButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleCollapsed}
      aria-label={collapseLabel}
    >
      {isCollapsed ? (
        <ChevronRightIcon className="h-5 w-5" />
      ) : (
        <ChevronLeftIcon className="h-5 w-5" />
      )}
    </Button>
  );

  return (
    <div
      className={`flex h-full grow flex-col gap-y-5 overflow-y-auto bg-sidebar text-sidebar-foreground ${
        isCollapsed ? 'items-center px-2' : 'px-5'
      }`}
    >
      <div
        className={`flex items-center pt-6 ${
          isCollapsed ? 'flex-col gap-3' : 'justify-between gap-2'
        }`}
      >
        <Brand collapsed={isCollapsed} />
        {variant === 'desktop' &&
          (isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{collapseButton}</TooltipTrigger>
              <TooltipContent side="right">{collapseLabel}</TooltipContent>
            </Tooltip>
          ) : (
            collapseButton
          ))}
      </div>
      <TeamDropdown collapsed={isCollapsed} />
      <Navigation collapsed={isCollapsed} />
      <div className={`mt-auto mb-4 flex w-full ${isCollapsed ? 'justify-center' : ''}`}>
        <AccountMenu collapsed={isCollapsed} />
      </div>
    </div>
  );
};

export default PrimarySidebar;
