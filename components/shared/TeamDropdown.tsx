import {
  ChevronUpDownIcon,
  CubeIcon,
  FolderIcon,
  FolderPlusIcon,
  RectangleStackIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import useCurrentTeamSlug from 'hooks/useCurrentTeamSlug';
import useTeamProjects from 'hooks/useTeamProjects';
import useTeams from 'hooks/useTeams';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';

import { cn } from 'cn';

import { maxLengthPolicies } from '@/lib/common';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TeamDropdown = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { teams } = useTeams();
  const { data } = useSession();
  const { t } = useTranslation('common');
  const slug = useCurrentTeamSlug();
  const { projects } = useTeamProjects(slug);

  const currentTeam = (teams || []).find((team) => team.slug === slug);
  const label =
    currentTeam?.name ||
    data?.user?.name?.substring(0, maxLengthPolicies.nameShortDisplay) ||
    '';

  const menus = [
    {
      id: 'teams',
      name: t('teams'),
      items: (teams || []).map((team) => ({
        id: team.id,
        name: team.name,
        href: `/teams/${team.slug}/products`,
        icon: FolderIcon,
      })),
    },
    ...(currentTeam && projects?.length
      ? [
          {
            id: 'projects',
            name: t('translation-projects'),
            items: projects.map((project) => ({
              id: project.id,
              name: project.name,
              href: `/teams/${currentTeam.slug}/projects/${project.id}`,
              icon: CubeIcon,
            })),
          },
        ]
      : []),
    {
      id: 'profile',
      name: t('profile'),
      items: [
        {
          id: data?.user.id,
          name: data?.user?.name,
          href: '/settings/account',
          icon: UserCircleIcon,
        },
      ],
    },
    {
      id: 'actions',
      name: '',
      items: [
        {
          id: 'all-teams',
          name: t('teams'),
          href: '/teams',
          icon: RectangleStackIcon,
        },
        {
          id: 'new-team',
          name: t('new-team'),
          href: '/teams?newTeam=true',
          icon: FolderPlusIcon,
        },
      ],
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({
            variant: 'outline',
            size: collapsed ? 'icon' : 'xl',
          }),
          collapsed
            ? 'size-8 font-medium'
            : 'h-8 w-full justify-between px-2.5 text-sm font-medium'
        )}
        aria-label={label}
      >
        {collapsed ? (
          label.charAt(0).toUpperCase() || <FolderIcon className="h-5 w-5" />
        ) : (
          <>
            <span className="truncate">{label}</span>
            <ChevronUpDownIcon className="h-5 w-5 shrink-0" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {menus.map(({ id, name, items }, index) => (
          <DropdownMenuGroup key={id}>
            {index > 0 && <DropdownMenuSeparator />}
            {name ? <DropdownMenuLabel>{name}</DropdownMenuLabel> : null}
            {items.map((item) => (
              <DropdownMenuItem asChild key={`${id}-${item.id}`}>
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TeamDropdown;
