import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

export function useProjectEnvironment() {
  const router = useRouter();
  const env =
    typeof router.query.env === 'string' ? router.query.env.trim() : '';

  const setEnvironment = useCallback(
    (slug: string) => {
      const nextQuery = { ...router.query };
      if (!slug || slug === 'production') {
        delete nextQuery.env;
      } else {
        nextQuery.env = slug;
      }
      void router.replace(
        { pathname: router.pathname, query: nextQuery },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  const environmentQuery = useMemo(() => (env ? env : undefined), [env]);

  return {
    environment: environmentQuery,
    setEnvironment,
  };
}

export function withEnvironment(url: string, environment?: string) {
  if (!environment) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}environment=${encodeURIComponent(environment)}`;
}
