import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  LanguageIcon,
  RectangleStackIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';

import EnvironmentSwitcher from '@/components/environments/EnvironmentSwitcher';
import { Button } from '@/components/ui/button';
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
  const projectId = typeof query.projectId === 'string' ? query.projectId : '';
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
      name: t('compare-environments'),
      href: `${base}/compare${envQuery}`,
      icon: ArrowsRightLeftIcon,
      active: pathname === `${base}/compare`,
    },
    {
      name: t('project-settings'),
      href: `${base}/settings${envQuery}`,
      icon: Cog6ToothIcon,
      active: pathname === `${base}/settings`,
    },
  ];

  return (
    <div className="flex h-full grow flex-col gap-y-3 overflow-y-auto bg-transparent px-2.5 pb-3 text-sidebar-accent-foreground">
      <div className="flex flex-col gap-2.5 pt-3.5">
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
          <ArrowLeftIcon className="h-3 w-3" />
          <span className="text-[14px]">{t('back-to-projects')}</span>
        </Link>

        <div>
          <h2 className="mt-1 truncate text-sm font-medium tracking-tight">
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

        <nav className="flex flex-1 flex-col">
          <NavigationItems menus={menus} tone="muted" />
        </nav>
      </div>
    </div>
  );
};

export default ProjectSidebar;
