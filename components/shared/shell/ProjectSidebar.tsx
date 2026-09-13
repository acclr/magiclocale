import {
  ArrowLeftIcon,
  ClockIcon,
  Cog6ToothIcon,
  FlagIcon,
  LanguageIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';

import EnvironmentSwitcher from '@/components/environments/EnvironmentSwitcher';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useProjectEnvironment } from 'hooks/useProjectEnvironment';
import { useProjectEnvironments } from 'hooks/useProjectVersions';
import useTeamProjects from 'hooks/useTeamProjects';

import NavigationItems from './NavigationItems';
import { MenuItem } from './NavigationItems';
import { useSidebarLayout } from './SidebarContext';

const ProjectSidebar = ({
  variant = 'desktop',
}: {
  variant?: 'desktop' | 'mobile';
}) => {
  const { t } = useTranslation('common');
  const { asPath, query } = useRouter();
  const { setMobileView } = useSidebarLayout();
  const slug = typeof query.slug === 'string' ? query.slug : '';
  const projectId =
    typeof query.projectId === 'string' ? query.projectId : '';
  const { projects } = useTeamProjects(slug);
  const { environment, setEnvironment } = useProjectEnvironment();
  const { environments } = useProjectEnvironments(slug, projectId);
  const project = (projects || []).find((item) => item.id === projectId);
  const pathname = asPath.split('?')[0];
  const envQuery =
    environment && environment !== 'production'
      ? `?env=${encodeURIComponent(environment)}`
      : '';
  const base = `/teams/${slug}/projects/${projectId}`;

  const menus: MenuItem[] = [
    {
      name: t('translation-workspace'),
      href: `${base}${envQuery}`,
      icon: LanguageIcon,
      active: pathname === base,
    },
    {
      name: t('feature-flags'),
      href: `${base}/flags${envQuery}`,
      icon: FlagIcon,
      active: pathname === `${base}/flags`,
    },
    {
      name: t('versions'),
      href: `${base}/versions${envQuery}`,
      icon: ClockIcon,
      active: pathname === `${base}/versions`,
    },
    {
      name: t('project-settings'),
      href: `${base}/settings${envQuery}`,
      icon: Cog6ToothIcon,
      active: pathname === `${base}/settings`,
    },
  ];

  return (
    <div className="flex h-full grow flex-col gap-y-5 overflow-y-auto bg-sidebar-accent px-4 pb-4 text-sidebar-accent-foreground">
      <div className="flex flex-col gap-3 pt-6">
        {variant === 'mobile' && (
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setMobileView('primary')}
          >
            <RectangleStackIcon className="h-5 w-5" />
            {t('team-menu')}
          </Button>
        )}
        <Link
          href={`/teams/${slug}/products`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('back-to-projects')}
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t('project')}
          </p>
          <h2 className="mt-1 truncate text-lg font-semibold">
            {project?.name || t('translation-workspace')}
          </h2>
        </div>
        {environments.length > 0 && (
          <EnvironmentSwitcher
            currentSlug={environment}
            environments={environments}
            onChange={setEnvironment}
          />
        )}
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col">
        <NavigationItems menus={menus} tone="muted" />
      </nav>
    </div>
  );
};

export default ProjectSidebar;
