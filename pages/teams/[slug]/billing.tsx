import useSWR from 'swr';
import { useTranslation } from '@/hooks/useTranslation';
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
import LocaleKitPricing from '@/components/billing/LocaleKitPricing';
import LocaleKitSubscriptions from '@/components/billing/LocaleKitSubscriptions';
import BillingProjectList from '@/components/billing/BillingProjectList';

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
  const projects = data?.data?.projects || [];

  return (
    <>
      {canAccess('team_payments', ['read']) && (
        <>
          <TeamTab
            activeTab="payments"
            team={team}
            teamFeatures={teamFeatures}
          />

          <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
            {t('team-billing-intro')}
          </p>

          <div className="flex flex-col gap-6 md:flex-row">
            <LinkToPortal team={team} />
            <Help />
          </div>

          <div className="py-6">
            <LocaleKitSubscriptions subscriptions={subscriptions} />
          </div>

          <h2 className="card-title mb-2 text-xl font-medium leading-none tracking-tight">
            {t('team-retainer-plans')}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('team-retainer-plans-help')}
          </p>
          <LocaleKitPricing plans={plans} />

          <div className="py-6">
            <BillingProjectList projects={projects} slug={team.slug} />
          </div>
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
