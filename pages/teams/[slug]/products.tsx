import ProjectList from '@/components/translations/ProjectList';
import useCanAccess from 'hooks/useCanAccess';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useRouter } from 'next/router';

const Products: NextPageWithLayout = () => {
  const { query } = useRouter();
  const { canAccess } = useCanAccess();
  const { slug } = query as { slug: string };

  return slug ? (
    <ProjectList
      canCreate={canAccess('team_translation_project', ['create'])}
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

export default Products;
