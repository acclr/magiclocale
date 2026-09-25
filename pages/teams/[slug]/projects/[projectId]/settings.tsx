import EnvironmentSettings from '@/components/environments/EnvironmentSettings';
import ProjectSettingsForm from '@/components/translations/ProjectSettingsForm';
import ProjectBillingSettings from '@/components/translations/ProjectBillingSettings';
import { Error as ErrorDisplay, Loading } from '@/components/shared';
import env from '@/lib/env';
import useCanAccess from 'hooks/useCanAccess';
import { useProjectEnvironment } from 'hooks/useProjectEnvironment';
import useTranslationWorkspace from 'hooks/useTranslationWorkspace';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/router';
import type { NextPageWithLayout, TeamFeature } from 'types';

const ProjectSettingsPage: NextPageWithLayout<{
  teamFeatures: TeamFeature;
}> = ({ teamFeatures }) => {
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
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {workspace.dashboard.project.name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{t('project-settings')}</h1>
      </div>
      <EnvironmentSettings
        canEdit={canAccess('team_environment', ['update'])}
        projectId={projectId}
        slug={slug}
      />
      <ProjectSettingsForm
        canDelete={canAccess('team_translation_project', ['delete'])}
        canUpdate={canAccess('team_translation_project', ['update'])}
        onAddLocale={workspace.addLocale}
        onDelete={workspace.deleteProject}
        onRemoveLocale={workspace.removeLocale}
        onRename={workspace.renameProject}
        onSetAllowedOrigins={workspace.setAllowedOrigins}
        project={workspace.dashboard.project}
      />
      {teamFeatures.payments && (
        <ProjectBillingSettings
          onScopeChanged={workspace.refresh}
          projectId={projectId}
          slug={slug}
        />
      )}
    </div>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: env.teamFeatures,
    },
  };
}

export default ProjectSettingsPage;
