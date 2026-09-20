import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { cn } from 'cn';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buttonVariants } from '@/components/ui/button';
import { useCustomSignOut } from '@/hooks/useCustomSignout';

const AccountMenu = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { status, data } = useSession();
  const { t } = useTranslation('common');
  const signOut = useCustomSignOut();

  if (status === 'loading' || !data) {
    return null;
  }

  const { user } = data;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({
            variant: 'outline',
            size: collapsed ? 'icon' : 'xl',
          }),
          collapsed
            ? 'h-10 w-10'
            : 'w-full justify-start text-sm font-semibold'
        )}
        aria-label={user.name || t('account')}
      >
        <UserCircleIcon className={collapsed ? 'h-5 w-5' : 'mr-0.5'} />
        {collapsed ? (
          <span className="sr-only">{user.name}</span>
        ) : (
          user.name
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={collapsed ? 'start' : 'end'} className="w-40">
        <DropdownMenuItem asChild>
          <Link href="/settings/account">
            <UserCircleIcon className="mr-1 h-5 w-5" /> {t('account')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <ArrowRightOnRectangleIcon className="mr-1 h-5 w-5" /> {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
