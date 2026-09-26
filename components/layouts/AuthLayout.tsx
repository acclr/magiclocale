import { Logo } from '@/components/shared/logo';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  heading?: string;
  description?: string;
}

export default function AuthLayout({
  children,
  heading,
  description,
}: AuthLayoutProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-20 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Link href="/">
            <Logo className="mx-auto h-12" color="light" />
          </Link>
          {heading && (
            <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
              {t(heading)}
            </h2>
          )}
          {description && (
            <p className="text-center text-muted-foreground">
              {t(description)}
            </p>
          )}
        </div>
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">{children}</div>
      </div>
    </>
  );
}
