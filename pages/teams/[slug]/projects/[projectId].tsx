import TranslationWorkspace from '@/components/translations/TranslationWorkspace';
import useCanAccess from 'hooks/useCanAccess';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import type { NextPageWithLayout } from 'types';

const TranslationProject: NextPageWithLayout = () => {
  const { query } = useRouter();
  const { canAccess } = useCanAccess();
  const { slug, projectId } = query as {
    slug: string;
    projectId: string;
  };

  return slug && projectId ? (
    <TranslationWorkspace
      canEdit={canAccess('team_translation', ['update'])}
      canUpdateProject={canAccess('team_translation_project', ['update'])}
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

export default TranslationProject;
