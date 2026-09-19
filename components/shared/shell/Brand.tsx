import app from '@/lib/app';
import Link from 'next/link';

import KeykitLogo from '@/components/shared/KeykitLogo';

const Brand = ({ collapsed = false }: { collapsed?: boolean }) => {
  const href = '/dashboard';

  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center text-xl font-bold text-foreground transition-[width] duration-200 ease-out ${
        collapsed ? 'justify-center' : 'gap-2'
      }`}
    >
      <KeykitLogo collapsed={collapsed} />
      {collapsed ? <span className="sr-only">{app.name}</span> : null}
    </Link>
  );
};

export default Brand;
