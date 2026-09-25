import { Card, InputWithLabel } from '@/components/shared';
import type { Project } from '../../domain/translations';
import { useFormik } from 'formik';
import { useTranslation } from '@/hooks/useTranslation';
import {
  AllowedOriginError,
  parseAllowedOrigin,
} from '@/lib/api/allowed-origin';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Button } from '@/components/shared';
import toast from 'react-hot-toast';

import LocaleName from './LocaleName';
import LocaleSelect from './LocaleSelect';

type ProjectSettingsFormProps = {
  project: Project;
  canUpdate: boolean;
  canDelete: boolean;
  onRename: (name: string) => Promise<Project>;
  onSetAllowedOrigins: (origins: string[]) => Promise<Project>;
  onAddLocale: (locale: string) => Promise<unknown>;
  onRemoveLocale: (locale: string) => Promise<unknown>;
  onDelete: () => Promise<void>;
};

const ProjectSettingsForm = ({
  project,
  canUpdate,
  canDelete,
  onRename,
  onSetAllowedOrigins,
  onAddLocale,
  onRemoveLocale,
  onDelete,
}: ProjectSettingsFormProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [locale, setLocale] = useState('');
  const [origin, setOrigin] = useState('');
  const [isLocaleBusy, setIsLocaleBusy] = useState(false);
  const [isOriginBusy, setIsOriginBusy] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const allowedOrigins = project.allowedOrigins ?? [];

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

  const addOrigin = async (event: React.FormEvent) => {
    event.preventDefault();
    let nextOrigin: string;
    try {
      nextOrigin = parseAllowedOrigin(origin);
    } catch (error) {
      toast.error(
        error instanceof AllowedOriginError
          ? error.message
          : t('allowed-origin-invalid')
      );
      return;
    }
    if (allowedOrigins.includes(nextOrigin)) {
      toast.error(t('allowed-origin-duplicate'));
      return;
    }
    setIsOriginBusy(true);
    try {
      await onSetAllowedOrigins([...allowedOrigins, nextOrigin]);
      setOrigin('');
      toast.success(t('allowed-origin-added'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error-500'));
    } finally {
      setIsOriginBusy(false);
    }
  };

  const removeOrigin = async (value: string) => {
    setIsOriginBusy(true);
    try {
      await onSetAllowedOrigins(
        allowedOrigins.filter((item) => item !== value)
      );
      toast.success(t('allowed-origin-removed'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error-500'));
    } finally {
      setIsOriginBusy(false);
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
            <InputWithLabel
              name="localeFormat"
              label={t('locale-format')}
              value={t(`locale-format-${project.localeFormat}`)}
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
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                key={code}
              >
                <span className="flex items-center gap-2 text-sm">
                  <LocaleName code={code} variant="full" />
                  {code === project.sourceLocale ? (
                    <span className="badge badge-primary badge-sm">
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
              <label className="form-control min-w-64 flex-1">
                <span className="label-text mb-1">{t('add-locale')}</span>
                <LocaleSelect
                  exclude={project.locales}
                  format={project.localeFormat}
                  onChange={setLocale}
                  required
                  value={locale}
                />
              </label>
              <button
                className="btn btn-primary btn-sm"
                disabled={isLocaleBusy || !locale}
                type="submit"
              >
                {t('add')}
              </button>
            </form>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Header>
            <Card.Title>{t('allowed-origins')}</Card.Title>
            <Card.Description>
              {t('allowed-origins-description')}
            </Card.Description>
          </Card.Header>
          {allowedOrigins.length > 0 && (
            <ul className="space-y-2">
              {allowedOrigins.map((value) => (
                <li
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  key={value}
                >
                  <span className="font-mono text-sm">{value}</span>
                  {canUpdate && (
                    <button
                      className="btn btn-ghost btn-xs"
                      disabled={isOriginBusy}
                      onClick={() => void removeOrigin(value)}
                      type="button"
                    >
                      {t('remove')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canUpdate && (
            <form className="mt-4 flex items-end gap-2" onSubmit={addOrigin}>
              <div className="flex-1">
                <InputWithLabel
                  name="origin"
                  label={t('allowed-origins')}
                  placeholder={t('allowed-origin-placeholder')}
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                />
              </div>
              <button
                className="btn btn-primary btn-sm mb-0.5"
                disabled={isOriginBusy || !origin.trim()}
                type="submit"
              >
                {t('add')}
              </button>
            </form>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Header>
            <Card.Title>{t('connect-your-app')}</Card.Title>
            <Card.Description>
              {t('connect-your-app-description')}
            </Card.Description>
          </Card.Header>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">{t('delivery-live-title')}</p>
              <p className="mt-1 text-muted-foreground">
                {t('delivery-live-description')}
              </p>
              <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
                {`# .env
KEYKIT_API_KEY=
KEYKIT_PROJECT_ID=${project.id}
KEYKIT_BASE_URL=https://www.keykit.dev

import { createKeykit, KeykitProvider } from '@keykithq/sdk/pages';
import { useKeykit } from '@keykithq/sdk/react';

const { getServerSideProps } = createKeykit();
export { getServerSideProps };

export default function Page({ keykit }) {
  return (
    <KeykitProvider keykit={keykit}>
      <App />
    </KeykitProvider>
  );
}

function App() {
  const { translate, locale, setLocale } = useKeykit();
  return (
    <button onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}>
      {translate('settings.save', 'Save changes')}
    </button>
  );
}`}
              </pre>
            </div>
            <div>
              <p className="font-medium">{t('delivery-static-title')}</p>
              <p className="mt-1 text-muted-foreground">
                {t('delivery-static-description')}
              </p>
              <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
                {`npx @keykit/cli pull --out ./locales

import catalog from './locales/catalog.json';
import { KeykitProvider } from '@keykithq/sdk/react';

<KeykitProvider
  config={{
    delivery: 'static',
    sourceLocale: catalog.sourceLocale,
    catalogs: catalog.locales,
  }}
>`}
              </pre>
            </div>
          </div>
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
