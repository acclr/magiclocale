import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button, LetterAvatar, WithLoadingAndError } from '@/components/shared';
import { CreateTeam } from '@/components/team';
import { useTranslation } from '@/hooks/useTranslation';
import useTeams from 'hooks/useTeams';

const DashboardHome = () => {
  const { t } = useTranslation('common');
  const { data: session } = useSession();
  const { teams, isLoading, isError } = useTeams();
  const [createTeamVisible, setCreateTeamVisible] = useState(false);

  const firstName = session?.user?.name?.split(' ')[0];

  return (
    <WithLoadingAndError isLoading={isLoading} error={isError}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-medium tracking-tight">
              {firstName
                ? t('dashboard-welcome', { name: firstName })
                : t('welcome-back')}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('dashboard-description')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="btn btn-ghost btn-sm" href="/teams">
              {t('manage-teams')}
            </Link>
            <Button color="primary" onClick={() => setCreateTeamVisible(true)}>
              {t('create-team')}
            </Button>
          </div>
        </div>

        {teams?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <Link
                className="card bg-card transition-colors hover:border-foreground/20 hover:bg-muted"
                href={`/teams/${team.slug}/products`}
                key={team.id}
              >
                <div className="card-body">
                  <div className="flex items-center gap-2.5">
                    <LetterAvatar name={team.name} />
                    <h2 className="card-title text-sm">{team.name}</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('member-count', { count: team._count.members })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <h2 className="font-semibold">{t('dashboard-empty-title')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('dashboard-empty-description')}
            </p>
            <Button
              className="mt-4"
              color="primary"
              onClick={() => setCreateTeamVisible(true)}
            >
              {t('create-team')}
            </Button>
          </div>
        )}

        <CreateTeam
          visible={createTeamVisible}
          setVisible={setCreateTeamVisible}
        />
      </div>
    </WithLoadingAndError>
  );
};

export default DashboardHome;
