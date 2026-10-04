import app from '@/lib/app';
import Link from 'next/link';

import KeykitLogo from '@/components/shared/KeykitLogo';

const Brand = ({ collapsed = false }: { collapsed?: boolean }) => {
  const href = '/teams';

  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center text-foreground transition-[width] duration-200 ease-out ${
        collapsed ? 'justify-center' : 'gap-2'
      }`}
    >
      <KeykitLogo collapsed={collapsed} heightClassName="h-6" />
      {collapsed ? <span className="sr-only">{app.name}</span> : null}
    </Link>
  );
};

export default Brand;
