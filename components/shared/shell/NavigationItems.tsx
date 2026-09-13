import Link from 'next/link';
import classNames from 'classnames';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  tone = 'default',
}: NavigationItemsProps) => {
  return (
    <ul role="list" className="flex flex-1 flex-col gap-1">
      {menus.map((menu) => (
        <li key={menu.name}>
          <NavigationItem collapsed={collapsed} menu={menu} tone={tone} />
          {menu.items && !collapsed && (
            <ul className="mt-1 flex flex-col gap-1">
              {menu.items.map((subitem) => (
                <li key={subitem.name}>
                  <NavigationItem
                    className="pl-9"
                    menu={subitem}
                    tone={tone}
                  />
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
  tone = 'default',
}: NavigationItemProps) => {
  const surface =
    tone === 'muted'
      ? 'hover:bg-sidebar hover:text-sidebar-foreground'
      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';
  const activeSurface =
    tone === 'muted' ? 'bg-sidebar' : 'bg-sidebar-accent';

  const link = (
    <Link
      href={menu.href}
      className={classNames(
        'group flex items-center rounded-lg text-sm text-sidebar-foreground',
        surface,
        collapsed ? 'justify-center p-2' : 'gap-2 p-2 px-2',
        menu.active && `${activeSurface} font-semibold text-sidebar-primary`,
        className
      )}
    >
      {menu.icon && (
        <menu.icon
          className={classNames(
            'h-5 w-5 shrink-0 group-hover:text-sidebar-accent-foreground',
            { 'text-sidebar-primary': menu.active }
          )}
          aria-hidden="true"
        />
      )}
      {collapsed ? <span className="sr-only">{menu.name}</span> : menu.name}
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
