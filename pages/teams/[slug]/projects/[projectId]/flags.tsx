import FlagList from '@/components/flags/FlagList';
import FlagMatrix from '@/components/flags/FlagMatrix';
import PublishBar from '@/components/versions/PublishBar';
import { Error as ErrorDisplay, Loading } from '@/components/shared';
import useCanAccess from 'hooks/useCanAccess';
import { useProjectEnvironment } from 'hooks/useProjectEnvironment';
import useTranslationWorkspace from 'hooks/useTranslationWorkspace';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/router';
import type { NextPageWithLayout } from 'types';

const ProjectFlagsPage: NextPageWithLayout = () => {
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
      <PublishBar
        canPublish={canAccess('team_version', ['publish'])}
        environmentName={workspace.dashboard.environment.name}
        onPublish={(message) => workspace.publish(message)}
        publishState={workspace.dashboard.publishState}
      />
      <div>
        <h1 className="text-2xl font-semibold">{t('feature-flags')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('feature-flags-help')}
        </p>
      </div>
      <FlagList
        canEdit={canAccess('team_feature_flag', ['update'])}
        environment={environment}
        projectId={projectId}
        slug={slug}
      />
      <FlagMatrix
        canEdit={canAccess('team_feature_flag', ['update'])}
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

export default ProjectFlagsPage;
