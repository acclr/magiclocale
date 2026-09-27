import Link from 'next/link';
import classNames from 'classnames';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';

export interface MenuItem {
  name: string;
  href: string;
  icon?: any;
  active?: boolean;
  items?: Omit<MenuItem, 'icon' | 'items'>[];
  className?: string;
}

export interface NavigationProps {
  activePathname: string | null;
  collapsed?: boolean;
}

interface NavigationItemsProps {
  menus: MenuItem[];
  collapsed?: boolean;
  tone?: 'default' | 'muted';
}

interface NavigationItemProps {
  menu: MenuItem;
  className?: string;
  collapsed?: boolean;
  tone?: 'default' | 'muted';
}

const NavigationItems = ({
  menus,
  collapsed = false,
}: NavigationItemsProps) => {
  return (
    <ul role="list" className="flex flex-1 flex-col gap-px">
      {menus.map((menu) => (
        <li key={menu.name}>
          <NavigationItem collapsed={collapsed} menu={menu} />
          {menu.items && !collapsed && (
            <ul className="mt-1 flex flex-col gap-1">
              {menu.items.map((subitem) => (
                <li key={subitem.name}>
                  <NavigationItem className="pl-9" menu={subitem} />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};

const NavigationItem = ({
  menu,
  className,
  collapsed = false,
}: NavigationItemProps) => {
  const surface = 'hover:bg-elevated active:bg-elevated';
  const activeSurface = 'bg-elevated';
  const activeText = 'text-foreground';

  const link = (
    <Link
      href={menu.href}
      className={classNames(
        'group -mx-1 flex items-center rounded-md text-[13px] leading-5 text-sidebar-foreground',
        surface,
        collapsed ? 'justify-center p-1.5' : 'gap-2 px-2 py-1.5',
        menu.active && `${activeSurface}`,
        className
      )}
    >
      {menu.icon && (
        <menu.icon
          className={classNames(
            'h-3.5 w-3.5 shrink-0',
            menu.active ? 'text-foreground' : 'text-foreground/50'
          )}
          aria-hidden="true"
        />
      )}
      <span
        className={cn('text-foreground/70 group-hover:text-foreground', {
          [activeText]: menu.active,
        })}
      >
        {collapsed ? <span className="sr-only">{menu.name}</span> : menu.name}
      </span>
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{menu.name}</TooltipContent>
    </Tooltip>
  );
};

export default NavigationItems;
