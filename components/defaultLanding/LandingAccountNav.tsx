import { useKeykit } from '@keykithq/sdk/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import { LetterAvatar } from '@/components/shared';

const pillClass =
  'rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80';

const LandingAccountNav = () => {
  const { data: session, status } = useSession();
  const { translate } = useKeykit();

  if (status === 'loading') {
    return <div className="h-8 w-8 rounded-full bg-elevated" aria-hidden />;
  }

  if (status === 'authenticated' && session?.user) {
    const label = session.user.name || session.user.email || '';

    return (
      <>
        <Link href="/dashboard" className={pillClass}>
          {translate('landing.nav.dashboard', 'Dashboard')}
        </Link>
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
      <Link
        href="/auth/login"
        className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
      >
        {translate('landing.nav.sign-in', 'Sign in')}
      </Link>
      <Link href="/auth/join" className={pillClass}>
        {translate('landing.nav.sign-up', 'Sign up')}
      </Link>
    </>
  );
};

export default LandingAccountNav;
