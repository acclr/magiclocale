import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TeamNavigation from './TeamNavigation';
import UserNavigation from './UserNavigation';

const Navigation = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { asPath, isReady, query } = useRouter();
  const [activePathname, setActivePathname] = useState<string | null>(null);
  const slug = typeof query.slug === 'string' ? query.slug : null;

  useEffect(() => {
    if (isReady && asPath) {
      setActivePathname(new URL(asPath, location.href).pathname);
    }
  }, [asPath, isReady]);

  return (
    <nav className="flex flex-1 flex-col">
      {slug ? (
        <TeamNavigation
          activePathname={activePathname}
          collapsed={collapsed}
          slug={slug}
        />
      ) : (
        <UserNavigation activePathname={activePathname} collapsed={collapsed} />
      )}
    </nav>
  );
};

export default Navigation;
