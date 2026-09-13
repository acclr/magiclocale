import app from '@/lib/app';
import Image from 'next/image';
import Link from 'next/link';

const Brand = ({ collapsed = false }: { collapsed?: boolean }) => {
  const href = '/dashboard';

  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center text-xl font-bold text-foreground ${
        collapsed ? 'justify-center' : 'gap-2'
      }`}
    >
      <Image src={app.logoUrl} alt={app.name} width={30} height={30} />
      {collapsed ? <span className="sr-only">{app.name}</span> : app.name}
    </Link>
  );
};

export default Brand;
