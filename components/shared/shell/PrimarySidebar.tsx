import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { useRouter } from 'next/router';

import TeamDropdown from '../TeamDropdown';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';
import AccountMenu from './AccountMenu';
import Brand from './Brand';
import Navigation from './Navigation';
import { useSidebarLayout } from './SidebarContext';

const SeeAllTeamsButton = ({ active }: { active: boolean }) => {
  const { t } = useTranslation('common');
  const label = t('see-all-teams');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'shrink-0 text-sidebar-foreground hover:bg-elevated',
            active && 'bg-elevated'
          )}
          asChild
        >
          <Link
            href="/teams"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <UserGroupIcon
              className={cn(
                'size-4',
                active ? 'text-foreground' : 'text-foreground/50'
              )}
            />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
};

const PrimarySidebar = ({
  variant = 'desktop',
}: {
  variant?: 'desktop' | 'mobile';
}) => {
  const { t } = useTranslation('common');
  const { asPath } = useRouter();
  const { collapsed, toggleCollapsed } = useSidebarLayout();
  const isCollapsed = variant === 'desktop' && collapsed;
  const onTeamsPage = asPath.split(/[?#]/)[0] === '/teams';
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
      className={`flex h-full grow flex-col gap-y-3 overflow-y-auto bg-sidebar text-sidebar-foreground ${
        isCollapsed ? 'items-center px-2' : 'px-2.5'
      }`}
    >
      <div
        className={`flex items-center pt-3.5 ${
          isCollapsed ? 'flex-col gap-2' : 'justify-between gap-2'
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
      <div
        className={cn(
          'flex w-full items-center gap-1',
          isCollapsed && 'flex-col'
        )}
      >
        <div className={cn(!isCollapsed && 'min-w-0 flex-1')}>
          <TeamDropdown collapsed={isCollapsed} />
        </div>
        <SeeAllTeamsButton active={onTeamsPage} />
      </div>
      <Navigation collapsed={isCollapsed} />
      <div
        className={`mt-auto mb-4 flex w-full ${isCollapsed ? 'justify-center' : ''}`}
      >
        <AccountMenu collapsed={isCollapsed} />
      </div>
    </div>
  );
};

export default PrimarySidebar;
