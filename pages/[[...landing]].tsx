import { Databuddy } from '@databuddy/sdk/dist/react';
import { KeykitProvider, type KeykitPageProps } from '@keykithq/sdk/pages';
import type { GetServerSideProps } from 'next';
import type { ReactElement } from 'react';

import { LandingView } from '@/content/landing/pages';
import type { NextPageWithLayout } from 'types';

const DATABUDDY_CLIENT_ID = '469dedda-b08b-42ab-b018-e20f70df7ca4';

type LandingRouteProps = {
  keykit: KeykitPageProps;
};

const LandingRoute: NextPageWithLayout<LandingRouteProps> = ({ keykit }) => {
  return (
    <KeykitProvider key={keykit.locale} keykit={keykit}>
      <Databuddy
        clientId={DATABUDDY_CLIENT_ID}
        disabled={process.env.NODE_ENV !== 'production'}
        trackErrors
        trackWebVitals
      />
      <LandingView slug={keykit.slug} />
    </KeykitProvider>
  );
};

export const getServerSideProps: GetServerSideProps<LandingRouteProps> = async (
  context
) => {
  context.res.setHeader('Cache-Control', 'private, no-store, must-revalidate');
  const { getLandingServerSideProps } =
    await import('@/lib/landing/page-props');
  return getLandingServerSideProps(context);
};

LandingRoute.getLayout = function getLayout(page: ReactElement) {
  return <>{page}</>;
};

export default LandingRoute;
