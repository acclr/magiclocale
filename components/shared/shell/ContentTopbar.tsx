import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import EnvironmentSwitcher from '@/components/environments/EnvironmentSwitcher';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from 'cn';
import { useProjectEnvironment } from 'hooks/useProjectEnvironment';
import { useProjectEnvironments } from 'hooks/useProjectVersions';
import useTeamProjects from 'hooks/useTeamProjects';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import LocaleName from '@/components/translations/LocaleName';
import useTranslationWorkspace from '@/hooks/useTranslationWorkspace';
import { WorkspaceToolbarSlot } from './WorkspaceToolbarSlot';

type ContentLink = {
  name: string;
  href: string;
  active: boolean;
};

const TEAM_TITLES: Record<string, string> = {
  '/teams': 'all-teams',
  '/teams/[slug]/products': 'translation-projects',
  '/teams/[slug]/settings': 'team-settings',
  '/teams/[slug]/members': 'members',
  '/teams/[slug]/sso': 'single-sign-on',
  '/teams/[slug]/directory-sync': 'directory-sync',
  '/teams/[slug]/audit-logs': 'audit-logs',
  '/teams/[slug]/billing': 'billing',
  '/teams/[slug]/webhooks': 'webhooks',
  '/teams/[slug]/api-keys': 'api-keys',
};

function ContentBar({
  title,
  links = [],
  leading,
  trailing,
}: {
  title?: string;
  links?: ContentLink[];
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  const { slug, projectId } = useRouter().query as {
    slug: string;
    projectId: string;
  };

  const { environment } = useProjectEnvironment();

  const workspace = useTranslationWorkspace(slug, projectId, {
    environment,
  });

  const dashboard = workspace.dashboard;

  const titleRepeatsLink = Boolean(
    title && links.some((link) => link.name === title)
  );

  if (!title && links.length === 0 && !leading && !trailing) {
    return null;
  }


  return (
    <header className="sticky top-12 z-30 border-b border-border bg-background/95 backdrop-blur-md lg:top-0">
      <div className="mx-auto flex flex-col max-w-7xl justify-start items-start gap-2 py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {leading}
            {title ? (
              <h1
                className={cn(
                  'truncate text-sm font-medium tracking-tight',
                  titleRepeatsLink && 'sr-only'
                )}
              >
                {title}
              </h1>
            ) : null}

            {dashboard?.project?.sourceLocale ? (
              <LocaleName code={dashboard?.project.sourceLocale} variant="full" />
            ) : null}
          </div>

          {trailing ? (
            <div className="ml-auto flex items-center gap-2">{trailing}</div>
          ) : null}
        </div>

        {links.length > 0 ? (
          <nav className="flex -mb-4 h-full min-w-0 items-center gap-4 overflow-x-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-full shrink-0 items-center border-b-2 py-2 text-sm',
                  link.active
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}

function readRouteId(
  value: string | string[] | undefined,
  asPath: string,
  pattern: RegExp
) {
  if (typeof value === 'string' && value) {
    return value;
  }

  return asPath.split('?')[0].match(pattern)?.[1] ?? '';
}

function ProjectContentTopbar() {
  const { t } = useTranslation('common');
  const { asPath, query } = useRouter();
  const slug = readRouteId(query.slug, asPath, /^\/teams\/([^/]+)/);
  const projectId = readRouteId(
    query.projectId,
    asPath,
    /^\/teams\/[^/]+\/projects\/([^/]+)/
  );
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
  const links: ContentLink[] = [
    {
      name: t('translation-workspace'),
      href: `${base}${envQuery}`,
      active: pathname === base,
    },
    {
      name: t('compare-environments'),
      href: `${base}/compare${envQuery}`,
      active: pathname === `${base}/compare`,
    },
    {
      name: t('project-settings'),
      href: `${base}/settings${envQuery}`,
      active: pathname === `${base}/settings`,
    },
  ];

  return (
    <ContentBar
      title={project?.name || t('translation-workspace')}
      links={slug && projectId ? links : []}
      leading={
        slug ? (
          <Link
            href={`/teams/${slug}/products`}
            aria-label={t('back-to-projects')}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground bg-foreground/5 hover:bg-foreground/10 hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
        ) : null
      }
      trailing={
        <>
          <WorkspaceToolbarSlot />
          {environments.length > 1 ? (
            <EnvironmentSwitcher
              compact
              currentSlug={environment}
              environments={environments}
              onChange={setEnvironment}
            />
          ) : null}
        </>
      }
    />
  );
}

function PageContentTopbar() {
  const { t } = useTranslation('common');
  const { pathname } = useRouter();

  if (pathname === '/settings/account' || pathname === '/settings/security') {
    return (
      <ContentBar
        links={[
          {
            name: t('account'),
            href: '/settings/account',
            active: pathname === '/settings/account',
          },
          {
            name: t('security'),
            href: '/settings/security',
            active: pathname === '/settings/security',
          },
        ]}
        title={pathname === '/settings/security' ? t('security') : t('account')}
      />
    );
  }

  const titleKey = TEAM_TITLES[pathname];

  if (!titleKey) {
    return null;
  }

  return <ContentBar title={t(titleKey)} />;
}

const ContentTopbar = () => {
  const { asPath, query } = useRouter();
  const onProject =
    typeof query.projectId === 'string' || /\/projects\/[^/?]+/.test(asPath);

  if (onProject) {
    return <ProjectContentTopbar />;
  }

  return <PageContentTopbar />;
};

export default ContentTopbar;
