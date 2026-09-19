import ArchitectureExplorer from '@/components/architecture/ArchitectureExplorer';
import useCanAccess from 'hooks/useCanAccess';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import type { NextPageWithLayout } from 'types';

const ArchitecturePage: NextPageWithLayout = () => {
  const { query } = useRouter();
  const { canAccess } = useCanAccess();
  const { slug, projectId } = query as { slug: string; projectId: string };
  return slug && projectId ? (
    <ArchitectureExplorer
      canEdit={canAccess('team_translation', ['update'])}
      projectId={projectId}
      slug={slug}
    />
  ) : null;
};

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default ArchitecturePage;
