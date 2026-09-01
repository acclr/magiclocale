import useSWR from 'swr';
import { useTranslation } from 'next-i18next';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import env from '@/lib/env';
import useTeam from 'hooks/useTeam';
import fetcher from '@/lib/fetcher';
import useCanAccess from 'hooks/useCanAccess';
import { TeamTab } from '@/components/team';
import Help from '@/components/billing/Help';
import { Error, Loading } from '@/components/shared';
import LinkToPortal from '@/components/billing/LinkToPortal';
import MagilocalePricing from '@/components/billing/MagilocalePricing';
import MagilocaleSubscriptions from '@/components/billing/MagilocaleSubscriptions';

const Payments = ({ teamFeatures }) => {
  const { t } = useTranslation('common');
  const { canAccess } = useCanAccess();
  const { isLoading, isError, team } = useTeam();
  const { data } = useSWR(
    team?.slug ? `/api/teams/${team.slug}/payments/products` : null,
    fetcher
  );

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!team) {
    return <Error message={t('team-not-found')} />;
  }

  const plans = data?.data?.plans || [];
  const subscriptions = data?.data?.subscriptions || [];

  return (
    <>
      {canAccess('team_payments', ['read']) && (
        <>
          <TeamTab
            activeTab="payments"
            team={team}
            teamFeatures={teamFeatures}
          />

          <div className="flex flex-col gap-6 md:flex-row">
            <LinkToPortal team={team} />
            <Help />
          </div>

          <div className="py-6">
            <MagilocaleSubscriptions subscriptions={subscriptions} />
          </div>

          <MagilocalePricing plans={plans} />
        </>
      )}
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.teamFeatures.payments) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: env.teamFeatures,
    },
  };
}

export default Payments;
