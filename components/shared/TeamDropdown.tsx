import {
  ChevronUpDownIcon,
  CubeIcon,
  FolderIcon,
  FolderPlusIcon,
  HomeIcon,
  RectangleStackIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import useTeamProjects from 'hooks/useTeamProjects';
import useTeams from 'hooks/useTeams';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { maxLengthPolicies } from '@/lib/common';
import { Button } from '@/components/ui/button';
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
  const router = useRouter();
  const { teams } = useTeams();
  const { data } = useSession();
  const { t } = useTranslation('common');
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
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
          id: 'home',
          name: t('home'),
          href: '/dashboard',
          icon: HomeIcon,
        },
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

  const trigger = collapsed ? (
    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10 font-bold"
      aria-label={label}
    >
      {label.charAt(0).toUpperCase() || <FolderIcon className="h-5 w-5" />}
    </Button>
  ) : (
    <Button
      variant="outline"
      className="h-10 w-full justify-between rounded-md px-4 text-sm font-bold"
    >
      <span className="truncate">{label}</span>
      <ChevronUpDownIcon className="h-5 w-5 shrink-0" />
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
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
