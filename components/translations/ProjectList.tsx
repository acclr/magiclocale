import type { Project } from '../../domain/translations';
import useTeamProjects from '../../hooks/useTeamProjects';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { Error as ErrorDisplay, Loading } from '@/components/shared';

type ProjectListProps = {
  slug: string;
  canCreate: boolean;
};

const ProjectList = ({ slug, canCreate }: ProjectListProps) => {
  const { t } = useTranslation('common');
  const { projects, isLoading, isError, createProject } = useTeamProjects(slug);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [sourceLocale, setSourceLocale] = useState('en');
  const [isCreating, setIsCreating] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreating(true);
    try {
      await createProject({ name, sourceLocale });
      setName('');
      setShowCreate(false);
      toast.success('Project created');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not create project'
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <ErrorDisplay message={isError.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {t('translation-projects')}
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            {t('translation-projects-description')}
          </p>
        </div>
        {canCreate && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreate((visible) => !visible)}
            type="button"
          >
            {t('new-translation-project')}
          </button>
        )}
      </div>

      {showCreate && (
        <form
          className="card border border-base-300 bg-base-100"
          onSubmit={submit}
        >
          <div className="card-body grid gap-4 md:grid-cols-[1fr_12rem_auto] md:items-end">
            <label className="form-control">
              <span className="label-text mb-2">
                {t('translation-project-name')}
              </span>
              <input
                autoFocus
                className="input input-bordered"
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-2">{t('source-locale')}</span>
              <input
                className="input input-bordered"
                maxLength={35}
                onChange={(event) => setSourceLocale(event.target.value)}
                required
                value={sourceLocale}
              />
            </label>
            <button
              className="btn btn-primary"
              disabled={isCreating}
              type="submit"
            >
              {isCreating ? t('creating') : t('create')}
            </button>
          </div>
        </form>
      )}

      {projects?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project: Project) => (
            <Link
              className="card border border-base-300 bg-base-100 transition hover:border-primary hover:shadow"
              href={`/teams/${slug}/projects/${project.id}`}
              key={project.id}
            >
              <div className="card-body">
                <h2 className="card-title text-lg">{project.name}</h2>
                <p className="text-sm text-base-content/60">
                  {t('source-locale')}: {project.sourceLocale}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.locales.map((locale) => (
                    <span className="badge badge-ghost" key={locale}>
                      {locale}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-base-300 p-12 text-center">
          <h2 className="font-semibold">{t('no-translation-projects')}</h2>
          <p className="mt-2 text-sm text-base-content/60">
            {canCreate
              ? t('create-first-translation-project')
              : t('ask-admin-create-translation-project')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
