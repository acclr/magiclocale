import KeyExplorer from '@/components/keys/KeyExplorer';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import type { NextPageWithLayout } from 'types';

const ProjectKeysPage: NextPageWithLayout = () => {
  const { query } = useRouter();
  const { slug, projectId } = query as { slug: string; projectId: string };
  return slug && projectId ? (
    <KeyExplorer projectId={projectId} slug={slug} />
  ) : null;
};

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default ProjectKeysPage;
