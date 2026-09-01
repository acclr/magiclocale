import { Card, InputWithLabel } from '@/components/shared';
import type { Project } from '../../domain/translations';
import { useFormik } from 'formik';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';

type ProjectSettingsFormProps = {
  project: Project;
  canUpdate: boolean;
  canDelete: boolean;
  onRename: (name: string) => Promise<Project>;
  onAddLocale: (locale: string) => Promise<unknown>;
  onRemoveLocale: (locale: string) => Promise<unknown>;
  onDelete: () => Promise<void>;
};

const ProjectSettingsForm = ({
  project,
  canUpdate,
  canDelete,
  onRename,
  onAddLocale,
  onRemoveLocale,
  onDelete,
}: ProjectSettingsFormProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [locale, setLocale] = useState('');
  const [isLocaleBusy, setIsLocaleBusy] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { name: project.name },
    onSubmit: async (values) => {
      try {
        await onRename(values.name);
        toast.success(t('successfully-updated'));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('error-500'));
      }
    },
  });

  const addLocale = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLocaleBusy(true);
    try {
      await onAddLocale(locale);
      setLocale('');
      toast.success(t('locale-added'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error-500'));
    } finally {
      setIsLocaleBusy(false);
    }
  };

  const removeLocale = async (code: string) => {
    setIsLocaleBusy(true);
    try {
      await onRemoveLocale(code);
      toast.success(t('locale-removed'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error-500'));
    } finally {
      setIsLocaleBusy(false);
    }
  };

  const deleteProject = async () => {
    if (!window.confirm(t('confirm-delete-project'))) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete();
      toast.success(t('project-deleted'));
      await router.push(`/teams/${router.query.slug}/products`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error-500'));
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={formik.handleSubmit}>
          <Card.Body>
            <Card.Header>
              <Card.Title>{t('project-settings')}</Card.Title>
              <Card.Description>
                {t('project-settings-description')}
              </Card.Description>
            </Card.Header>
            <InputWithLabel
              name="name"
              label={t('translation-project-name')}
              value={formik.values.name}
              onChange={formik.handleChange}
              disabled={!canUpdate}
            />
            <InputWithLabel
              name="projectId"
              label={t('project-id')}
              value={project.id}
              disabled
            />
            <InputWithLabel
              name="sourceLocale"
              label={t('source-locale')}
              value={project.sourceLocale}
              disabled
            />
          </Card.Body>
          {canUpdate && (
            <Card.Footer>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  color="primary"
                  loading={formik.isSubmitting}
                  disabled={!formik.dirty}
                  size="md"
                >
                  {t('save-changes')}
                </Button>
              </div>
            </Card.Footer>
          )}
        </form>
      </Card>

      <Card>
        <Card.Body>
          <Card.Header>
            <Card.Title>{t('project-locales')}</Card.Title>
            <Card.Description>
              {t('project-locales-description')}
            </Card.Description>
          </Card.Header>
          <ul className="space-y-2">
            {project.locales.map((code) => (
              <li
                className="flex items-center justify-between rounded-md border border-base-300 px-3 py-2"
                key={code}
              >
                <span className="font-mono text-sm">
                  {code}
                  {code === project.sourceLocale ? (
                    <span className="badge badge-primary badge-sm ml-2">
                      {t('source')}
                    </span>
                  ) : null}
                </span>
                {canUpdate && code !== project.sourceLocale && (
                  <button
                    className="btn btn-ghost btn-xs"
                    disabled={isLocaleBusy}
                    onClick={() => void removeLocale(code)}
                    type="button"
                  >
                    {t('remove')}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {canUpdate && (
            <form className="mt-4 flex items-end gap-2" onSubmit={addLocale}>
              <label className="form-control">
                <span className="label-text mb-1">{t('add-locale')}</span>
                <input
                  className="input input-bordered input-sm w-32"
                  maxLength={35}
                  onChange={(event) => setLocale(event.target.value)}
                  placeholder="fr"
                  required
                  value={locale}
                />
              </label>
              <button
                className="btn btn-primary btn-sm"
                disabled={isLocaleBusy}
                type="submit"
              >
                {t('add')}
              </button>
            </form>
          )}
        </Card.Body>
      </Card>

      {canDelete && (
        <Card>
          <Card.Body>
            <Card.Header>
              <Card.Title>{t('delete-project')}</Card.Title>
              <Card.Description>
                {t('delete-project-description')}
              </Card.Description>
            </Card.Header>
          </Card.Body>
          <Card.Footer>
            <div className="flex justify-end">
              <Button
                color="error"
                loading={isDeleting}
                onClick={() => void deleteProject()}
                size="md"
              >
                {t('delete')}
              </Button>
            </div>
          </Card.Footer>
        </Card>
      )}
    </div>
  );
};

export default ProjectSettingsForm;
