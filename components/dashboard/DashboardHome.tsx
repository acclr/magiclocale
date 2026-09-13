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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              {firstName
                ? t('dashboard-welcome', { name: firstName })
                : t('welcome-back')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard-description')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="btn btn-ghost btn-sm" href="/teams">
              {t('manage-teams')}
            </Link>
            <Button
              color="primary"
              onClick={() => setCreateTeamVisible(true)}
            >
              {t('create-team')}
            </Button>
          </div>
        </div>

        {teams?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <Link
                className="card bg-card transition hover:bg-muted"
                href={`/teams/${team.slug}/products`}
                key={team.id}
              >
                <div className="card-body">
                  <div className="flex items-center gap-3">
                    <LetterAvatar name={team.name} />
                    <h2 className="card-title text-lg">{team.name}</h2>
                  </div>
                  <p className="mt-1 text-base text-foreground/50">
                    {t('member-count', { count: team._count.members })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
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
