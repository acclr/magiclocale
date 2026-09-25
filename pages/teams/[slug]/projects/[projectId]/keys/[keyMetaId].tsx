import KeyDetail from '@/components/keys/KeyDetail';
import useCanAccess from 'hooks/useCanAccess';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import type { NextPageWithLayout } from 'types';

const ProjectKeyDetailPage: NextPageWithLayout = () => {
  const { query } = useRouter();
  const { canAccess } = useCanAccess();
  const { slug, projectId, keyMetaId } = query as {
    slug: string;
    projectId: string;
    keyMetaId: string;
  };
  return slug && projectId && keyMetaId ? (
    <KeyDetail
      canEdit={canAccess('team_translation', ['update'])}
      keyMetaId={keyMetaId}
      projectId={projectId}
      slug={slug}
    />
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

export default ProjectKeyDetailPage;
