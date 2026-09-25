import EnvironmentCompare from '@/components/environments/EnvironmentCompare';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import type { NextPageWithLayout } from 'types';

const ComparePage: NextPageWithLayout = () => {
  const { query } = useRouter();
  const { slug, projectId } = query as { slug: string; projectId: string };
  return slug && projectId ? (
    <EnvironmentCompare projectId={projectId} slug={slug} />
  ) : null;
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default ComparePage;
