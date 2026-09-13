import { InputWithCopyButton, InputWithLabel } from '@/components/shared';
import type { Team } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import { Button } from '@/components/shared';
import { toast } from 'react-hot-toast';
import { useSWRConfig } from 'swr';
import type { ApiResponse } from 'types';
import Modal from '../shared/Modal';
import { defaultHeaders } from '@/lib/common';
import { useFormik } from 'formik';
import { z } from 'zod';
import { createApiKeySchema } from '@/lib/zod';
import useTeamProjects from 'hooks/useTeamProjects';
import { useProjectEnvironments } from 'hooks/useProjectVersions';

const NewAPIKey = ({
  team,
  createModalVisible,
  setCreateModalVisible,
}: NewAPIKeyProps) => {
  const { mutate } = useSWRConfig();
  const [apiKey, setApiKey] = useState('');

  const onNewAPIKey = (apiKey: string) => {
    setApiKey(apiKey);
    mutate(`/api/teams/${team.slug}/api-keys`);
  };

  const toggleVisible = () => {
    setCreateModalVisible(!createModalVisible);
    setApiKey('');
  };

  return (
    <Modal open={createModalVisible} close={toggleVisible}>
      {apiKey === '' ? (
        <CreateAPIKeyForm
          team={team}
          onNewAPIKey={onNewAPIKey}
          closeModal={toggleVisible}
        />
      ) : (
        <DisplayAPIKey apiKey={apiKey} closeModal={toggleVisible} />
      )}
    </Modal>
  );
};

const CreateAPIKeyForm = ({
  team,
  onNewAPIKey,
  closeModal,
}: CreateAPIKeyFormProps) => {
  const { t } = useTranslation('common');

  const projects = useTeamProjects(team.slug);
  const [projectId, setProjectId] = useState('');
  const environments = useProjectEnvironments(team.slug, projectId);
  const formik = useFormik<z.infer<typeof createApiKeySchema>>({
    initialValues: {
      name: '',
      projectId: undefined,
      environmentId: undefined,
    },
    validateOnBlur: false,
    validate: (values) => {
      try {
        createApiKeySchema.parse(values);
      } catch (error: any) {
        return error.formErrors.fieldErrors;
      }
    },
    onSubmit: async (values) => {
      const response = await fetch(`/api/teams/${team.slug}/api-keys`, {
        method: 'POST',
        body: JSON.stringify(values),
        headers: defaultHeaders,
      });

      const { data, error } = (await response.json()) as ApiResponse<{
        apiKey: string;
      }>;

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.apiKey) {
        onNewAPIKey(data.apiKey);
        toast.success(t('api-key-created'));
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} method="POST">
      <Modal.Header>{t('new-api-key')}</Modal.Header>
      <Modal.Description>{t('api-key-description')}</Modal.Description>
      <Modal.Body>
        <InputWithLabel
          label={t('name')}
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          placeholder="My API Key"
          className="text-sm"
          error={formik.errors.name}
        />
        <label className="form-control mt-3">
          <span className="label-text text-sm">{t('api-key-scope')}</span>
          <select
            className="select select-bordered select-sm"
            onChange={(event) => {
              const next = event.target.value;
              setProjectId(next);
              void formik.setFieldValue('projectId', next || undefined);
              void formik.setFieldValue('environmentId', undefined);
            }}
            value={projectId}
          >
            <option value="">{t('api-key-unbound')}</option>
            {(projects.projects ?? []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <span className="label-text-alt mt-1 text-muted-foreground">
            {t('api-key-scope-help')}
          </span>
        </label>
        {projectId ? (
          <label className="form-control mt-3">
            <span className="label-text text-sm">{t('environment')}</span>
            <select
              className="select select-bordered select-sm"
              onChange={(event) =>
                void formik.setFieldValue(
                  'environmentId',
                  event.target.value || undefined
                )
              }
              value={formik.values.environmentId ?? ''}
            >
              <option value="">{t('production-default')}</option>
              {environments.environments.map((environment) => (
                <option key={environment.id} value={environment.id}>
                  {environment.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="outline" onClick={closeModal} size="md">
          {t('close')}
        </Button>
        <Button
          color="primary"
          type="submit"
          loading={formik.isSubmitting}
          disabled={!formik.dirty || !formik.isValid}
          size="md"
        >
          {t('create-api-key')}
        </Button>
      </Modal.Footer>
    </form>
  );
};

const DisplayAPIKey = ({ apiKey, closeModal }: DisplayAPIKeyProps) => {
  const { t } = useTranslation('common');

  return (
    <>
      <Modal.Header>{t('new-api-key')}</Modal.Header>
      <Modal.Description>{t('new-api-warning')}</Modal.Description>
      <Modal.Body>
        <InputWithCopyButton
          label={t('api-key')}
          value={apiKey}
          className="text-sm"
          readOnly
        />
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="outline" onClick={closeModal} size="md">
          {t('close')}
        </Button>
      </Modal.Footer>
    </>
  );
};

interface NewAPIKeyProps {
  team: Team;
  createModalVisible: boolean;
  setCreateModalVisible: (visible: boolean) => void;
}

interface CreateAPIKeyFormProps {
  team: Team;
  onNewAPIKey: (apiKey: string) => void;
  closeModal: () => void;
}

interface DisplayAPIKeyProps {
  apiKey: string;
  closeModal: () => void;
}

export default NewAPIKey;
