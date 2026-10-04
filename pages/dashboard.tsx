import type { NextPageWithLayout } from 'types';

const Dashboard: NextPageWithLayout = () => null;

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/teams',
      permanent: false,
    },
  };
}

export default Dashboard;
