import ProjectNav from '@/components/translations/ProjectNav';
import ProjectSettingsForm from '@/components/translations/ProjectSettingsForm';
import { Error as ErrorDisplay, Loading } from '@/components/shared';
import useCanAccess from 'hooks/useCanAccess';
import useTranslationWorkspace from 'hooks/useTranslationWorkspace';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import type { NextPageWithLayout } from 'types';

const ProjectSettingsPage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const { query } = useRouter();
  const { canAccess } = useCanAccess();
  const { slug, projectId } = query as { slug: string; projectId: string };
  const workspace = useTranslationWorkspace(slug, projectId);

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
      <ProjectNav active="settings" projectId={projectId} slug={slug} />
      <ProjectSettingsForm
        canDelete={canAccess('team_translation_project', ['delete'])}
        canUpdate={canAccess('team_translation_project', ['update'])}
        onAddLocale={workspace.addLocale}
        onDelete={workspace.deleteProject}
        onRemoveLocale={workspace.removeLocale}
        onRename={workspace.renameProject}
        project={workspace.dashboard.project}
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

export default ProjectSettingsPage;
