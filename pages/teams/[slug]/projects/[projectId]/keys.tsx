import type { GetServerSidePropsContext } from 'next';
import type { NextPageWithLayout } from 'types';

const ProjectKeysPage: NextPageWithLayout = () => null;

export async function getServerSideProps({
  query,
}: GetServerSidePropsContext) {
  const slug = typeof query.slug === 'string' ? query.slug : '';
  const projectId = typeof query.projectId === 'string' ? query.projectId : '';
  const env = typeof query.env === 'string' ? query.env : '';
  const envQuery =
    env && env !== 'production' ? `?env=${encodeURIComponent(env)}` : '';

  if (!slug || !projectId) {
    return { notFound: true };
  }

  return {
    redirect: {
      destination: `/teams/${slug}/projects/${projectId}${envQuery}`,
      permanent: false,
    },
  };
}

export default ProjectKeysPage;
