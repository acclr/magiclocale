import type { LocaleFormat, Project } from '../../domain/translations';
import { defaultLocaleForFormat } from '../../domain/translations';
import useTeamProjects from '../../hooks/useTeamProjects';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { Error as ErrorDisplay, Loading } from '@/components/shared';
import LocaleName from './LocaleName';
import LocaleSelect from './LocaleSelect';
import { Separator } from '../ui/separator';

type ProjectListProps = {
  slug: string;
  canCreate: boolean;
};

const ProjectList = ({ slug, canCreate }: ProjectListProps) => {
  const { t } = useTranslation('common');
  const { projects, isLoading, isError, createProject } = useTeamProjects(slug);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [localeFormat, setLocaleFormat] = useState<LocaleFormat>('language');
  const [sourceLocale, setSourceLocale] = useState(
    defaultLocaleForFormat('language')
  );
  const [billingScope, setBillingScope] = useState<'team' | 'project'>('team');
  const [isCreating, setIsCreating] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreating(true);
    try {
      await createProject({ name, sourceLocale, localeFormat, billingScope });
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
          <p className="mt-1 text-sm text-muted-foreground">
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
        <form className="card bg-card" onSubmit={submit}>
          <div className="card-body grid gap-4 md:grid-cols-2 md:items-end">
            <label className="form-control md:col-span-2">
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
            <label className="form-control md:col-span-2">
              <span className="label-text mb-2">{t('locale-format')}</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['language', 'regional'] as const).map((format) => (
                  <label
                    className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2 ${
                      localeFormat === format
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                    key={format}
                  >
                    <input
                      checked={localeFormat === format}
                      className="radio radio-primary radio-sm mt-1"
                      name="localeFormat"
                      onChange={() => {
                        setLocaleFormat(format);
                        setSourceLocale(defaultLocaleForFormat(format));
                      }}
                      type="radio"
                      value={format}
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {t(`locale-format-${format}`)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t(`locale-format-${format}-help`)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </label>
            <label className="form-control md:col-span-2">
              <span className="label-text mb-2">{t('source-locale')}</span>
              <LocaleSelect
                format={localeFormat}
                onChange={setSourceLocale}
                required
                size="md"
                value={sourceLocale}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-2">{t('project-billing')}</span>
              <select
                className="select select-bordered"
                onChange={(event) =>
                  setBillingScope(event.target.value as 'team' | 'project')
                }
                value={billingScope}
              >
                <option value="team">{t('billing-scope-team')}</option>
                <option value="project">{t('billing-scope-project')}</option>
              </select>
            </label>
            <button
              className="btn btn-primary md:col-span-2"
              disabled={isCreating || !sourceLocale}
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
              className="card bg-card transition hover:bg-muted"
              href={`/teams/${slug}/projects/${project.id}/keys`}
              key={project.id}
            >
              <div className="card-body">
                <h2 className="card-title text-lg">{project.name}</h2>

                <p className="mt-1 text-base text-foreground/50">
                  {project.billingScope === 'project'
                    ? t('billing-scope-project')
                    : t('billing-scope-team')}
                </p>
                <Separator
                  orientation="horizontal"
                  className="my-2.5 bg-foreground/5"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.locales.map((locale) => (
                    <LocaleName code={locale} key={locale} />
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <h2 className="font-semibold">{t('no-translation-projects')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
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
