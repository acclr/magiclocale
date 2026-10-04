import { Error, Loading } from '@/components/shared';
import useTeam from 'hooks/useTeam';
import { useTranslation } from '@/hooks/useTranslation';
import APIKeys from './APIKeys';

const APIKeysContainer = () => {
  const { t } = useTranslation('common');

  const { isLoading, isError, team } = useTeam();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!team) {
    return <Error message={t('team-not-found')} />;
  }

  return <APIKeys team={team} />;
};

export default APIKeysContainer;
