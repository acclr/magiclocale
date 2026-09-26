import { useKeykit } from '@keykithq/sdk/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import { LetterAvatar } from '@/components/shared';
import { Button } from '@/components/ui/button';

const LandingAccountNav = () => {
  const { data: session, status } = useSession();
  const { translate } = useKeykit();

  if (status === 'loading') {
    return <div className="h-8 w-8 rounded-full bg-muted" aria-hidden />;
  }

  if (status === 'authenticated' && session?.user) {
    const label = session.user.name || session.user.email || '';

    return (
      <>
        <Button asChild size="sm">
          <Link href="/dashboard">
            {translate('landing.nav.dashboard', 'Dashboard')}
          </Link>
        </Button>
        <span
          role="img"
          title={label}
          aria-label={label || translate('landing.nav.account', 'Account')}
        >
          <LetterAvatar name={label || 'Account'} />
        </span>
      </>
    );
  }

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hidden sm:inline-flex"
      >
        <Link href="/auth/login">
          {translate('landing.nav.sign-in', 'Sign in')}
        </Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/auth/join">
          {translate('landing.nav.sign-up', 'Sign up')}
        </Link>
      </Button>
    </>
  );
};

export default LandingAccountNav;
