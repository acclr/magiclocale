import { EmptyState, WithLoadingAndError } from '@/components/shared';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import type { ApiKey, Team } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import { Button } from '@/components/shared';
import { toast } from 'react-hot-toast';
import type { ApiResponse } from 'types';
import NewAPIKey from './NewAPIKey';
import useAPIKeys from 'hooks/useAPIKeys';
import { Table } from '@/components/shared/table/Table';

interface APIKeysProps {
  team: Team;
}

const APIKeys = ({ team }: APIKeysProps) => {
  const { t } = useTranslation('common');
  const { data, isLoading, error, mutate } = useAPIKeys(team.slug);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [confirmationDialogVisible, setConfirmationDialogVisible] =
    useState(false);

  // Delete API Key
  const deleteApiKey = async (apiKey: ApiKey | null) => {
    if (!apiKey) {
      return;
    }

    const response = await fetch(
      `/api/teams/${team.slug}/api-keys/${apiKey.id}`,
      {
        method: 'DELETE',
      }
    );

    setSelectedApiKey(null);
    setConfirmationDialogVisible(false);

    if (!response.ok) {
      const { error } = (await response.json()) as ApiResponse;
      toast.error(error.message);
      return;
    }

    mutate();
    toast.success(t('api-key-deleted'));
  };

  const apiKeys = data?.data ?? [];

  return (
    <WithLoadingAndError isLoading={isLoading} error={error}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <h2 className="text-xl font-medium leading-none tracking-tight">
              {t('api-keys')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('api-keys-description')}
            </p>
          </div>
          <Button
            color="primary"
            size="md"
            onClick={() => setCreateModalVisible(true)}
          >
            {t('create-api-key')}
          </Button>
        </div>
        {apiKeys.length === 0 ? (
          <EmptyState
            title={t('no-api-key-title')}
            description={t('api-key-description')}
          />
        ) : (
          <>
            <Table
              cols={[
                t('name'),
                t('environment'),
                t('status'),
                t('created'),
                t('actions'),
              ]}
              body={apiKeys.map((apiKey) => {
                const scoped = apiKey as typeof apiKey & {
                  environment?: {
                    name: string;
                    project?: { name: string };
                  } | null;
                };
                const scopeLabel = scoped.environment
                  ? `${scoped.environment.project?.name ?? ''} · ${
                      scoped.environment.name
                    }`
                  : t('api-key-unbound');
                return {
                  id: apiKey.id,
                  cells: [
                    { wrap: true, text: apiKey.name },
                    { wrap: true, text: scopeLabel },
                    {
                      badge: {
                        color: 'success',
                        text: t('active'),
                      },
                    },
                    {
                      wrap: true,
                      text: new Date(apiKey.createdAt).toLocaleDateString(),
                    },
                    {
                      buttons: [
                        {
                          color: 'error',
                          text: t('revoke'),
                          onClick: () => {
                            setSelectedApiKey(apiKey);
                            setConfirmationDialogVisible(true);
                          },
                        },
                      ],
                    },
                  ],
                };
              })}
            ></Table>
            <ConfirmationDialog
              title={t('revoke-api-key')}
              visible={confirmationDialogVisible}
              onConfirm={() => deleteApiKey(selectedApiKey)}
              onCancel={() => setConfirmationDialogVisible(false)}
              cancelText={t('cancel')}
              confirmText={t('revoke-api-key')}
            >
              {t('revoke-api-key-confirm')}
            </ConfirmationDialog>
          </>
        )}
        <NewAPIKey
          team={team}
          createModalVisible={createModalVisible}
          setCreateModalVisible={setCreateModalVisible}
        />
      </div>
    </WithLoadingAndError>
  );
};

export default APIKeys;
