import VersionHistory from '@/components/versions/VersionHistory';
import { Error as ErrorDisplay, Loading } from '@/components/shared';
import useCanAccess from 'hooks/useCanAccess';
import { useProjectEnvironment } from 'hooks/useProjectEnvironment';
import useTranslationWorkspace from 'hooks/useTranslationWorkspace';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/router';
import type { NextPageWithLayout } from 'types';

const ProjectVersionsPage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const { query } = useRouter();
  const { canAccess } = useCanAccess();
  const { slug, projectId } = query as { slug: string; projectId: string };
  const { environment } = useProjectEnvironment();
  const workspace = useTranslationWorkspace(slug, projectId, { environment });

  if (workspace.isLoading) {
    return <Loading />;
  }

  if (workspace.isError) {
    return <ErrorDisplay message={workspace.isError.message} />;
  }

  if (!workspace.dashboard) {
    return <ErrorDisplay message={t('translation-project-not-found')} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t('versions')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('versions-help')}
        </p>
      </div>
      <VersionHistory
        canPublish={canAccess('team_version', ['publish'])}
        environment={environment}
        environments={workspace.dashboard.environments}
        projectId={projectId}
        slug={slug}
      />
    </div>
  );
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

export default ProjectVersionsPage;
