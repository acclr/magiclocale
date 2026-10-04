import type { GetServerSidePropsContext } from 'next';
import type { NextPageWithLayout } from 'types';

const Dashboard: NextPageWithLayout = () => null;

export async function getServerSideProps(_context: GetServerSidePropsContext) {
  return {
    redirect: {
      destination: '/teams',
      permanent: false,
    },
  };
}

export default Dashboard;
