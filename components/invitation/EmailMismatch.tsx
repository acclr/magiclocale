import { Button } from '@/components/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useCustomSignOut } from 'hooks/useCustomSignout';

interface EmailMismatchProps {
  email: string;
}

const EmailMismatch = ({ email }: EmailMismatchProps) => {
  const { t } = useTranslation('common');
  const signOut = useCustomSignOut();

  return (
    <>
      <p className="text-sm text-center">
        {t('email-mismatch-error', { email })}
      </p>
      <p className="text-sm text-center">
        {t('accept-invitation-email-instruction')}
      </p>
      <Button
        fullWidth
        color="error"
        size="md"
        variant="outline"
        onClick={signOut}
      >
        {t('logout')}
      </Button>
    </>
  );
};

export default EmailMismatch;
