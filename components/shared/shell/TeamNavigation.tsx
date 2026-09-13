import {
  CodeBracketIcon,
  Cog6ToothIcon,
  HomeIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import env from '@/lib/env';
import useCanAccess from 'hooks/useCanAccess';
import { useTranslation } from '@/hooks/useTranslation';

import NavigationItems from './NavigationItems';
import { MenuItem, NavigationProps } from './NavigationItems';

interface NavigationItemsProps extends NavigationProps {
  slug: string;
}

const TeamNavigation = ({
  slug,
  activePathname,
  collapsed = false,
}: NavigationItemsProps) => {
  const { t } = useTranslation('common');
  const { canAccess } = useCanAccess();
  const teamFeatures = env.teamFeatures;
  const onProjectRoute = Boolean(
    activePathname?.startsWith(`/teams/${slug}/projects/`)
  );
  const onProductsRoute = activePathname === `/teams/${slug}/products`;
  const settingsItems: MenuItem[] = [];

  if (canAccess('team_member', ['create', 'update', 'read', 'delete'])) {
    settingsItems.push({
      name: t('members'),
      href: `/teams/${slug}/members`,
      active: activePathname === `/teams/${slug}/members`,
    });
  }

  if (
    teamFeatures.sso &&
    canAccess('team_sso', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('single-sign-on'),
      href: `/teams/${slug}/sso`,
      active: activePathname === `/teams/${slug}/sso`,
    });
  }

  if (
    teamFeatures.dsync &&
    canAccess('team_dsync', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('directory-sync'),
      href: `/teams/${slug}/directory-sync`,
      active: activePathname === `/teams/${slug}/directory-sync`,
    });
  }

  if (
    teamFeatures.auditLog &&
    canAccess('team_audit_log', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('audit-logs'),
      href: `/teams/${slug}/audit-logs`,
      active: activePathname === `/teams/${slug}/audit-logs`,
    });
  }

  if (
    teamFeatures.payments &&
    canAccess('team_payments', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('billing'),
      href: `/teams/${slug}/billing`,
      active: activePathname === `/teams/${slug}/billing`,
    });
  }

  if (
    teamFeatures.webhook &&
    canAccess('team_webhook', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('webhooks'),
      href: `/teams/${slug}/webhooks`,
      active: activePathname === `/teams/${slug}/webhooks`,
    });
  }

  if (
    teamFeatures.apiKey &&
    canAccess('team_api_key', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('api-keys'),
      href: `/teams/${slug}/api-keys`,
      active: activePathname === `/teams/${slug}/api-keys`,
    });
  }

  const menus: MenuItem[] = [
    {
      name: t('home'),
      href: '/dashboard',
      icon: HomeIcon,
      active: activePathname === '/dashboard',
    },
    {
      name: t('teams'),
      href: '/teams',
      icon: RectangleStackIcon,
      active: activePathname === '/teams',
    },
    {
      name: t('translation-projects'),
      href: `/teams/${slug}/products`,
      icon: CodeBracketIcon,
      active: onProductsRoute || onProjectRoute,
    },
    {
      name: t('settings'),
      href: `/teams/${slug}/settings`,
      icon: Cog6ToothIcon,
      active:
        Boolean(activePathname?.startsWith(`/teams/${slug}`)) &&
        !onProductsRoute &&
        !onProjectRoute,
      items: settingsItems,
    },
  ];

  return <NavigationItems collapsed={collapsed} menus={menus} />;
};

export default TeamNavigation;
