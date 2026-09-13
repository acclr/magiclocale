import type { Team } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import { TeamFeature } from 'types';

interface TeamTabProps {
  activeTab: string;
  team: Team;
  heading?: string;
  teamFeatures: TeamFeature;
}

const titles: Record<string, string> = {
  settings: 'settings',
  members: 'members',
  sso: 'single-sign-on',
  'directory-sync': 'directory-sync',
  'audit-logs': 'audit-logs',
  payments: 'billing',
  webhooks: 'webhooks',
  'api-keys': 'api-keys',
};

const TeamTab = ({ activeTab, team, heading }: TeamTabProps) => {
  const { t } = useTranslation('common');
  const titleKey = titles[activeTab];

  return (
    <div className="flex flex-col pb-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {team.name}
      </p>
      <h2 className="mt-1 text-xl font-semibold">
        {heading || (titleKey ? t(titleKey) : team.name)}
      </h2>
    </div>
  );
};

export default TeamTab;
