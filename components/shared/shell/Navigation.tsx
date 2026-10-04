import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TeamNavigation from './TeamNavigation';

const Navigation = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { asPath, isReady } = useRouter();
  const [activePathname, setActivePathname] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && asPath) {
      setActivePathname(new URL(asPath, location.href).pathname);
    }
  }, [asPath, isReady]);

  return (
    <nav className="flex flex-1 flex-col">
      <TeamNavigation activePathname={activePathname} collapsed={collapsed} />
    </nav>
  );
};

export default Navigation;
