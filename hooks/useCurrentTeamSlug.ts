import useTeams from 'hooks/useTeams';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const LAST_TEAM_SLUG_KEY = 'keykit.lastTeamSlug';

function readLastTeamSlug() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(LAST_TEAM_SLUG_KEY);
}

function writeLastTeamSlug(slug: string) {
  window.localStorage.setItem(LAST_TEAM_SLUG_KEY, slug);
}

const useCurrentTeamSlug = () => {
  const router = useRouter();
  const { teams } = useTeams();
  const routeSlug =
    typeof router.query.slug === 'string' ? router.query.slug : '';
  const [remembered, setRemembered] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    setRemembered(readLastTeamSlug());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!routeSlug) {
      return;
    }

    writeLastTeamSlug(routeSlug);
    setRemembered(routeSlug);
  }, [routeSlug]);

  if (routeSlug) {
    return routeSlug;
  }

  if (!storageReady) {
    return '';
  }

  const knownSlugs = teams?.map((team) => team.slug);

  if (remembered && (!knownSlugs || knownSlugs.includes(remembered))) {
    return remembered;
  }

  return knownSlugs?.[0] ?? '';
};

export default useCurrentTeamSlug;
