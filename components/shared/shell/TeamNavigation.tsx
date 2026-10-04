import {
  ArrowPathIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  FingerPrintIcon,
  KeyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import env from '@/lib/env';
import useCanAccess from 'hooks/useCanAccess';
import useCurrentTeamSlug from 'hooks/useCurrentTeamSlug';
import { useTranslation } from '@/hooks/useTranslation';

import NavigationItems from './NavigationItems';
import { MenuItem, NavigationProps } from './NavigationItems';

const TeamNavigation = ({
  activePathname,
  collapsed = false,
}: NavigationProps) => {
  const { t } = useTranslation('common');
  const { canAccess } = useCanAccess();
  const slug = useCurrentTeamSlug();
  const teamFeatures = env.teamFeatures;
  const onProjectRoute = Boolean(
    slug && activePathname?.startsWith(`/teams/${slug}/projects/`)
  );
  const onProductsRoute = Boolean(
    slug && activePathname === `/teams/${slug}/products`
  );
  const settingsItems: MenuItem[] = [];

  if (slug) {
    settingsItems.push({
      name: t('team-settings'),
      href: `/teams/${slug}/settings`,
      icon: Cog6ToothIcon,
      active: activePathname === `/teams/${slug}/settings`,
    });
  }

  if (
    slug &&
    canAccess('team_member', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('members'),
      href: `/teams/${slug}/members`,
      icon: UsersIcon,
      active: activePathname === `/teams/${slug}/members`,
    });
  }

  if (
    slug &&
    teamFeatures.sso &&
    canAccess('team_sso', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('single-sign-on'),
      href: `/teams/${slug}/sso`,
      icon: FingerPrintIcon,
      active: activePathname === `/teams/${slug}/sso`,
    });
  }

  if (
    slug &&
    teamFeatures.dsync &&
    canAccess('team_dsync', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('directory-sync'),
      href: `/teams/${slug}/directory-sync`,
      icon: ArrowPathIcon,
      active: activePathname === `/teams/${slug}/directory-sync`,
    });
  }

  if (
    slug &&
    teamFeatures.auditLog &&
    canAccess('team_audit_log', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('audit-logs'),
      href: `/teams/${slug}/audit-logs`,
      icon: ClipboardDocumentListIcon,
      active: activePathname === `/teams/${slug}/audit-logs`,
    });
  }

  if (
    slug &&
    teamFeatures.payments &&
    canAccess('team_payments', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('billing'),
      href: `/teams/${slug}/billing`,
      icon: CreditCardIcon,
      active: activePathname === `/teams/${slug}/billing`,
    });
  }

  if (
    slug &&
    teamFeatures.webhook &&
    canAccess('team_webhook', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('webhooks'),
      href: `/teams/${slug}/webhooks`,
      icon: BoltIcon,
      active: activePathname === `/teams/${slug}/webhooks`,
    });
  }

  if (
    slug &&
    teamFeatures.apiKey &&
    canAccess('team_api_key', ['create', 'update', 'read', 'delete'])
  ) {
    settingsItems.push({
      name: t('api-keys'),
      href: `/teams/${slug}/api-keys`,
      icon: KeyIcon,
      active: activePathname === `/teams/${slug}/api-keys`,
    });
  }

  const menus: MenuItem[] = [];

  if (slug) {
    menus.push({
      name: t('translation-projects'),
      href: `/teams/${slug}/products`,
      icon: CodeBracketIcon,
      active: onProductsRoute || onProjectRoute,
    });
  }

  if (settingsItems.length > 0) {
    menus.push({
      name: t('settings'),
      section: true,
      items: settingsItems,
    });
  }

  return <NavigationItems collapsed={collapsed} menus={menus} />;
};

export default TeamNavigation;
